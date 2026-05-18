import argparse, os, json, time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, models, transforms
from sklearn.model_selection import train_test_split

# ── Config ────────────────────────────────────────────────────────────────────
IMG_SIZE    = (224, 224)
NUM_CLASSES = 9

# IMPORTANT: this must stay in alphabetical order — it matches exactly what
# torchvision.datasets.ImageFolder assigns when it scans the dataset directory.
# Changing this order will corrupt label assignments.
CLASS_NAMES = [
    "Adenomyomatosis of the GB",         # 0
    "Carcinoma",                          # 1
    "Cholecystitis",                      # 2
    "Gallbladder-Wall Thickening",        # 3
    "Gallstones",                         # 4
    "Gangrenous Cholecystitis",           # 5
    "Intraabdominal and Retroperitoneum", # 6
    "Perforation of GB",                  # 7
    "Polyps and Cholesterol Crystals",    # 8
]

# ── Transforms ────────────────────────────────────────────────────────────────
train_transform = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.1, contrast=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

val_transform = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ── Model ─────────────────────────────────────────────────────────────────────
def build_model(num_classes: int, dropout: float = 0.3) -> nn.Module:
    model = models.efficientnet_b3(weights=models.EfficientNet_B3_Weights.IMAGENET1K_V1)
    # Freeze all base layers first (Phase 1)
    for param in model.parameters():
        param.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=dropout, inplace=True),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=dropout * 0.7),
        nn.Linear(256, num_classes),
    )
    return model

# ── Data loading ──────────────────────────────────────────────────────────────
def load_splits(data_dir: str, batch_size: int):
    # Validate folders
    missing = [c for c in CLASS_NAMES if not os.path.isdir(os.path.join(data_dir, c))]
    if missing:
        raise FileNotFoundError(
            f"Missing class folders in '{data_dir}':\n" +
            "\n".join(f"  - {m}" for m in missing) +
            "\nFolder names are case-sensitive."
        )

    # Load full dataset — ImageFolder assigns indices alphabetically,
    # which matches CLASS_NAMES order above exactly. No remapping needed.
    full_dataset = datasets.ImageFolder(data_dir, transform=train_transform)

    # Sanity check: confirm order matches CLASS_NAMES
    if full_dataset.classes != CLASS_NAMES:
        raise ValueError(
            f"ImageFolder class order does not match CLASS_NAMES!\n"
            f"  ImageFolder: {full_dataset.classes}\n"
            f"  CLASS_NAMES: {CLASS_NAMES}\n"
            f"Update CLASS_NAMES in both train_model.py and app.py to match."
        )

    indices = list(range(len(full_dataset)))
    labels  = [full_dataset.targets[i] for i in indices]

    # Stratified 80/10/10 split
    train_idx, temp_idx, _, temp_labels = train_test_split(
        indices, labels, test_size=0.20, stratify=labels, random_state=42
    )
    val_idx, test_idx = train_test_split(
        temp_idx, test_size=0.50, stratify=temp_labels, random_state=42
    )

    train_set = Subset(full_dataset, train_idx)

    # Val/test get a clean copy of the dataset with val transforms
    val_dataset = datasets.ImageFolder(data_dir, transform=val_transform)
    val_set  = Subset(val_dataset, val_idx)
    test_set = Subset(val_dataset, test_idx)

    pin = torch.cuda.is_available()
    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True,  num_workers=2, pin_memory=pin)
    val_loader   = DataLoader(val_set,   batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=pin)
    test_loader  = DataLoader(test_set,  batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=pin)

    print(f"  Train: {len(train_set)} | Val: {len(val_set)} | Test: {len(test_set)}")
    return train_loader, val_loader, test_loader

# ── Training loop ─────────────────────────────────────────────────────────────
def run_epoch(model, loader, criterion, optimizer, device, train=True):
    model.train(train)
    total_loss, correct, total = 0.0, 0, 0
    with torch.set_grad_enabled(train):
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            if train:
                optimizer.zero_grad()
            outputs = model(imgs)
            loss    = criterion(outputs, labels)
            if train:
                loss.backward()
                optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct    += (outputs.argmax(1) == labels).sum().item()
            total      += imgs.size(0)
    return total_loss / total, correct / total

# ── Main training ─────────────────────────────────────────────────────────────
def train(args):
    os.makedirs("model", exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n🖥️  Device: {device}")
    print(f"📂  Dataset: {args.data_dir}")
    print(f"    Classes ({NUM_CLASSES}): {', '.join(CLASS_NAMES)}\n")

    train_loader, val_loader, test_loader = load_splits(args.data_dir, args.batch_size)

    model     = build_model(NUM_CLASSES, args.dropout).to(device)
    criterion = nn.CrossEntropyLoss()

    # ── Phase 1: Train head only ──────────────────────────────────────────────
    print("🏋  Phase 1 — Training classification head only …")
    optimizer1  = torch.optim.Adam(model.classifier.parameters(), lr=1e-3)
    scheduler1  = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer1, patience=3, factor=0.3)
    best_val    = 0.0
    patience_ct = 0

    for epoch in range(1, args.epochs // 2 + 1):
        t = time.time()
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer1, device, train=True)
        vl_loss, vl_acc = run_epoch(model, val_loader,   criterion, optimizer1, device, train=False)
        scheduler1.step(vl_loss)
        elapsed = time.time() - t
        print(f"  Epoch {epoch:3d} | train_loss={tr_loss:.4f} acc={tr_acc:.4f} | "
              f"val_loss={vl_loss:.4f} acc={vl_acc:.4f} | {elapsed:.1f}s")
        if vl_acc > best_val:
            best_val = vl_acc
            torch.save(model.state_dict(), "model/gallbladder_model_phase1.pth")
            patience_ct = 0
        else:
            patience_ct += 1
            if patience_ct >= 5:
                print("  Early stopping (Phase 1)")
                break

    # ── Phase 2: Fine-tune last 30 layers of EfficientNet ────────────────────
    print("\n🔧  Phase 2 — Fine-tuning top EfficientNet layers …")
    # Unfreeze the last 30 layers of the feature extractor
    layers = list(model.features.children())
    for layer in layers[-3:]:          # unfreeze last 3 blocks (~30 layers)
        for param in layer.parameters():
            param.requires_grad = True

    optimizer2  = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()), lr=1e-5
    )
    scheduler2  = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer2, patience=3, factor=0.3)
    best_val    = 0.0
    patience_ct = 0

    for epoch in range(1, args.epochs + 1):
        t = time.time()
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer2, device, train=True)
        vl_loss, vl_acc = run_epoch(model, val_loader,   criterion, optimizer2, device, train=False)
        scheduler2.step(vl_loss)
        elapsed = time.time() - t
        print(f"  Epoch {epoch:3d} | train_loss={tr_loss:.4f} acc={tr_acc:.4f} | "
              f"val_loss={vl_loss:.4f} acc={vl_acc:.4f} | {elapsed:.1f}s")
        if vl_acc > best_val:
            best_val = vl_acc
            torch.save(model.state_dict(), "model/gallbladder_model.pth")
            patience_ct = 0
        else:
            patience_ct += 1
            if patience_ct >= 7:
                print("  Early stopping (Phase 2)")
                break

    # ── Evaluation ────────────────────────────────────────────────────────────
    print("\n📊  Evaluating best model on test set …")
    model.load_state_dict(torch.load("model/gallbladder_model.pth",
                                     map_location=device, weights_only=True))
    _, test_acc = run_epoch(model, test_loader, criterion, None, device, train=False)
    print(f"\n✅  Test Accuracy: {test_acc:.4f}")

    with open("model/class_names.json", "w") as f:
        json.dump(CLASS_NAMES, f, indent=2)

    print("💾  Weights  → model/gallbladder_model.pth")
    print("    Classes  → model/class_names.json")


# ── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train GallCare AI (PyTorch, 9-class, no Normal)")
    parser.add_argument("--data_dir",   default="./dataset", help="Path to dataset root")
    parser.add_argument("--epochs",     type=int,   default=30,  help="Fine-tune epochs (Phase 2)")
    parser.add_argument("--batch_size", type=int,   default=32,  help="Batch size")
    parser.add_argument("--dropout",    type=float, default=0.3, help="Dropout rate")
    train(parser.parse_args())

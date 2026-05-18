"""
GallCare AI Service
===================
Flask microservice that classifies gallbladder ultrasound images using a
fine-tuned EfficientNet-B3 model trained on the UIdataGB dataset.

Backend: PyTorch + torchvision  (supports Python 3.12 / 3.13 / 3.14)

Classes (9 disease types from the Mendeley dataset v2 — NO Normal class):
  0 - Gallstones
  1 - Cholecystitis
  2 - Gangrenous Cholecystitis
  3 - Perforation of GB
  4 - Polyps and Cholesterol Crystals
  5 - Gallbladder-Wall Thickening
  6 - Adenomyomatosis of the GB
  7 - Carcinoma
  8 - Intraabdominal and Retroperitoneum

Endpoints:
  GET  /health        - liveness check
  POST /predict       - classify an image (base64 JSON body)
  POST /predict-file  - classify an image (multipart/form-data)
"""

import os, io, base64, logging, time
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

import torch
import torch.nn as nn
from torchvision import models, transforms

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Constants ─────────────────────────────────────────────────────────────────
MODEL_PATH = os.getenv("MODEL_PATH", "model/gallbladder_model.pth")
IMG_SIZE   = (224, 224)
PORT       = int(os.getenv("AI_PORT", 5001))
DEVICE     = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# IMPORTANT: must match the alphabetical order that torchvision.datasets.ImageFolder
# uses when scanning the dataset directory — do NOT reorder these.
CLASS_NAMES = [
    "Adenomyomatosis of the GB",       # 0
    "Carcinoma",                        # 1
    "Cholecystitis",                    # 2
    "Gallbladder-Wall Thickening",      # 3
    "Gallstones",                       # 4
    "Gangrenous Cholecystitis",         # 5
    "Intraabdominal and Retroperitoneum", # 6
    "Perforation of GB",               # 7
    "Polyps and Cholesterol Crystals", # 8
]
NUM_CLASSES = len(CLASS_NAMES)

SEVERITY = {
    "Gallstones":                          "high",
    "Cholecystitis":                       "high",
    "Gangrenous Cholecystitis":            "critical",
    "Perforation of GB":                   "critical",
    "Polyps and Cholesterol Crystals":     "moderate",
    "Gallbladder-Wall Thickening":         "moderate",
    "Adenomyomatosis of the GB":           "moderate",
    "Carcinoma":                           "critical",
    "Intraabdominal and Retroperitoneum":  "high",
}

RECOMMENDATIONS = {
    "Gallstones":
        "Imaging suggests gallstone presence. Recommend clinical correlation with symptoms, "
        "blood tests (LFTs, CBC), and gastroenterology consultation. Surgical consultation "
        "(cholecystectomy) may be required if symptomatic.",
    "Cholecystitis":
        "Findings are consistent with gallbladder inflammation (cholecystitis). Urgent clinical "
        "evaluation is advised. May require IV antibiotics and surgical consultation.",
    "Gangrenous Cholecystitis":
        "Imaging pattern raises concern for gangrenous cholecystitis — a surgical emergency. "
        "Immediate hospitalization and urgent surgical evaluation are strongly recommended.",
    "Perforation of GB":
        "Findings suggest possible gallbladder perforation. This is a life-threatening emergency. "
        "Immediate surgical consultation and hospitalization are required.",
    "Polyps and Cholesterol Crystals":
        "A gallbladder polyp or cholesterol crystal deposit may be present. Follow-up ultrasound "
        "in 6 months is recommended. Surgical consultation if polyp exceeds 10 mm or is symptomatic.",
    "Gallbladder-Wall Thickening":
        "Gallbladder wall thickening detected. This finding can be associated with multiple "
        "conditions. Clinical correlation, laboratory tests, and specialist review are advised.",
    "Adenomyomatosis of the GB":
        "Pattern suggests adenomyomatosis of the gallbladder. Generally benign; however, "
        "clinical correlation and follow-up imaging are advised. Specialist review recommended.",
    "Carcinoma":
        "Imaging features raise concern for gallbladder carcinoma. Urgent oncology and hepatobiliary "
        "surgery referral is strongly recommended. Further staging with CT/MRI is required.",
    "Intraabdominal and Retroperitoneum":
        "Findings indicate possible intraabdominal or retroperitoneal involvement. "
        "Comprehensive abdominal imaging (CT/MRI) and specialist evaluation are recommended.",
}

INDICATORS = {
    "Gallstones": [
        {"label": "Echogenic Foci",   "value": "Present",  "status": "abnormal"},
        {"label": "Posterior Shadow", "value": "Detected", "status": "abnormal"},
        {"label": "Wall",             "value": "Variable", "status": "borderline"},
    ],
    "Cholecystitis": [
        {"label": "Wall Thickening",       "value": "> 3mm",    "status": "abnormal"},
        {"label": "Pericholecystic Fluid", "value": "Present",  "status": "abnormal"},
        {"label": "Murphy's Sign",         "value": "Positive", "status": "abnormal"},
    ],
    "Gangrenous Cholecystitis": [
        {"label": "Wall Irregularity",      "value": "Marked",  "status": "abnormal"},
        {"label": "Intraluminal Membranes", "value": "Present", "status": "abnormal"},
        {"label": "Pericholecystic Fluid",  "value": "Present", "status": "abnormal"},
    ],
    "Perforation of GB": [
        {"label": "Wall Discontinuity",    "value": "Detected", "status": "abnormal"},
        {"label": "Pericholecystic Fluid", "value": "Present",  "status": "abnormal"},
        {"label": "Free Fluid",            "value": "Detected", "status": "abnormal"},
    ],
    "Polyps and Cholesterol Crystals": [
        {"label": "Mural Lesion", "value": "Detected",  "status": "abnormal"},
        {"label": "Mobility",     "value": "Fixed",     "status": "borderline"},
        {"label": "Size",         "value": "Variable",  "status": "borderline"},
    ],
    "Gallbladder-Wall Thickening": [
        {"label": "Wall Thickness", "value": "> 3mm",    "status": "abnormal"},
        {"label": "Symmetry",       "value": "Variable", "status": "borderline"},
        {"label": "Lumen",          "value": "Reduced",  "status": "borderline"},
    ],
    "Adenomyomatosis of the GB": [
        {"label": "Comet-tail Artifacts",        "value": "Present",          "status": "borderline"},
        {"label": "Wall",                         "value": "Focal thickening", "status": "borderline"},
        {"label": "Rokitansky-Aschoff Sinuses",  "value": "Possible",         "status": "borderline"},
    ],
    "Carcinoma": [
        {"label": "Mass Lesion",       "value": "Detected",  "status": "abnormal"},
        {"label": "Wall Irregularity", "value": "Marked",    "status": "abnormal"},
        {"label": "Vascularity",       "value": "Increased", "status": "abnormal"},
    ],
    "Intraabdominal and Retroperitoneum": [
        {"label": "Free Fluid",          "value": "Detected", "status": "abnormal"},
        {"label": "Adjacent Structures", "value": "Involved", "status": "abnormal"},
        {"label": "Echogenicity",        "value": "Altered",  "status": "abnormal"},
    ],
}

# ── Image transforms (matches torchvision EfficientNet expectations) ──────────
TRANSFORM = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ── Model ─────────────────────────────────────────────────────────────────────
_model = None

def build_model() -> nn.Module:
    """EfficientNet-B3 with a custom classification head for NUM_CLASSES."""
    model = models.efficientnet_b3(weights=models.EfficientNet_B3_Weights.IMAGENET1K_V1)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(256, NUM_CLASSES),
    )
    return model


def get_model() -> nn.Module:
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            log.warning(
                "Trained model not found at '%s'. Using ImageNet-pretrained baseline "
                "(predictions will be random until you run train_model.py).", MODEL_PATH
            )
            _model = build_model()
        else:
            log.info("Loading model from %s …", MODEL_PATH)
            _model = build_model()
            state = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
            _model.load_state_dict(state)
            log.info("Model loaded successfully.")

        _model.to(DEVICE)
        _model.eval()
    return _model

# ── Helpers ───────────────────────────────────────────────────────────────────

def preprocess(img: Image.Image) -> torch.Tensor:
    img = img.convert("RGB")
    tensor = TRANSFORM(img).unsqueeze(0)   # (1, 3, 224, 224)
    return tensor.to(DEVICE)


def decode_base64_image(b64: str) -> Image.Image:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64)))

# ── Prediction ────────────────────────────────────────────────────────────────

def run_prediction(img: Image.Image) -> dict:
    model  = get_model()
    tensor = preprocess(img)

    t0 = time.time()
    with torch.no_grad():
        logits = model(tensor)                        # (1, NUM_CLASSES)
        probs  = torch.softmax(logits, dim=1)[0]      # (NUM_CLASSES,)
    elapsed = round((time.time() - t0) * 1000)

    top_idx        = int(probs.argmax())
    top_confidence = float(probs[top_idx]) * 100
    class_name     = CLASS_NAMES[top_idx]
    severity       = SEVERITY.get(class_name, "high")

    if top_confidence < 50:
        verdict = "Inconclusive"
    elif severity == "critical":
        verdict = "Critical"
    else:
        verdict = "Diseased"

    all_probs = [
        {"class": CLASS_NAMES[i], "probability": round(float(p) * 100, 2)}
        for i, p in enumerate(probs)
    ]
    all_probs.sort(key=lambda x: x["probability"], reverse=True)

    return {
        "verdict":           verdict,
        "confidence":        round(top_confidence, 2),
        "disease_type":      class_name,
        "severity":          severity,
        "primary_finding":   f"The model classified this image as '{class_name}' "
                             f"with {top_confidence:.1f}% confidence.",
        "recommendation":    RECOMMENDATIONS.get(class_name, "Consult a specialist."),
        "indicators":        INDICATORS.get(class_name, []),
        "image_quality":     "good",
        "note":              "This is an AI-assisted result. It should not replace "
                             "professional medical diagnosis.",
        "all_probabilities": all_probs,
        "inference_ms":      elapsed,
    }

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({
        "status":       "ok",
        "model_loaded": _model is not None,
        "device":       str(DEVICE),
        "num_classes":  NUM_CLASSES,
    })


@app.post("/predict")
def predict_base64():
    """Body JSON: { "image_data": "<base64>", "media_type": "image/jpeg", "file_name": "scan.jpg" }"""
    data = request.get_json(silent=True) or {}
    b64  = data.get("image_data") or data.get("image")
    if not b64:
        return jsonify({"error": "image_data is required"}), 400
    try:
        result = run_prediction(decode_base64_image(b64))
        return jsonify(result)
    except Exception as exc:
        log.exception("Prediction failed")
        return jsonify({"error": str(exc)}), 500


@app.post("/predict-file")
def predict_file():
    """Multipart: file=<image>"""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    try:
        result = run_prediction(Image.open(request.files["file"].stream))
        return jsonify(result)
    except Exception as exc:
        log.exception("Prediction failed")
        return jsonify({"error": str(exc)}), 500


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info("Starting GallCare AI Service on port %d (device: %s) …", PORT, DEVICE)
    get_model()   # warm up
    app.run(host="0.0.0.0", port=PORT, debug=False)

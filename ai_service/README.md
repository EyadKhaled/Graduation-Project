# GallCare AI Service

Flask microservice for gallbladder disease classification.  
**Backend: PyTorch + torchvision** (supports Python 3.12 / 3.13 / 3.14).

## Classes

9 disease categories from the UIdataGB dataset.

| # | Class |
|---|-------|
| 0 | Gallstones |
| 1 | Cholecystitis |
| 2 | Gangrenous Cholecystitis |
| 3 | Perforation of GB |
| 4 | Polyps and Cholesterol Crystals |
| 5 | Gallbladder-Wall Thickening |
| 6 | Adenomyomatosis of the GB |
| 7 | Carcinoma |
| 8 | Intraabdominal and Retroperitoneum |

## Dataset folder structure

```
dataset/
  Gallstones/
  Cholecystitis/
  Gangrenous Cholecystitis/
  Perforation of GB/
  Polyps and Cholesterol Crystals/
  Gallbladder-Wall Thickening/
  Adenomyomatosis of the GB/
  Carcinoma/
  Intraabdominal and Retroperitoneum/
```
Folder names are **case-sensitive**.

## Installation

```bash
pip install -r requirements.txt
```

## Training

```bash
python train_model.py --data_dir ./dataset --epochs 30 --batch_size 32
```

Saves to `model/gallbladder_model.pth` (weights only, ~50 MB).

## Running the service

```bash
python app.py
```

Default port: **5001** — set `AI_PORT` env var to override.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/predict` | Classify image (base64 JSON) |
| POST | `/predict-file` | Classify image (multipart/form-data) |

### POST /predict

```json
{ "image_data": "<base64>", "media_type": "image/jpeg", "file_name": "scan.jpg" }
```

### Response

```json
{
  "verdict": "Diseased | Critical | Inconclusive",
  "confidence": 87.4,
  "disease_type": "Gallstones",
  "severity": "high",
  "primary_finding": "...",
  "recommendation": "...",
  "indicators": [...],
  "image_quality": "good",
  "note": "AI-assisted — not a substitute for medical diagnosis.",
  "all_probabilities": [...],
  "inference_ms": 142
}
```

## Verdict rules

| Verdict | When |
|---------|------|
| `Critical` | Gangrenous Cholecystitis, Perforation of GB, or Carcinoma |
| `Diseased` | All other classes, confidence ≥ 50% |
| `Inconclusive` | Confidence < 50% or non-gallbladder image |

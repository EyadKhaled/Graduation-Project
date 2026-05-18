# GallCare — Gallbladder Disease Detection Platform

Full-stack application: React frontend + Node.js backend + Python AI service.

```
project/
├── frontend/          React + Vite
├── backend/           Node.js + Express + MongoDB
└── ai_service/        Flask + PyTorch
```

---

## Quick Start

### 1. Backend (Node.js)

```bash
cd backend
npm install
cp .env.example .env
npm run dev       # runs on port 8000
```

### 2. AI Service (Python / Flask)

```bash
cd ai_service
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

python train_model.py --data_dir ./dataset --epochs 30
# 4. Then start:
python app.py
```

Service runs on **port 5001** by default.

### 3. Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_BASE_URL=http://localhost:8000/api
npm run dev               # runs on port 5173
```

---

## How Analysis Works

```
User uploads image (browser)
        ↓
POST /api/analysis/analyze/   (Node.js backend)
        ↓
POST /predict                 (Python Flask — TensorFlow EfficientNetB3)
        ↓
Returns: verdict, confidence, disease_type, indicators …
        ↓
Report saved to MongoDB
        ↓
Result shown to user
```

---

## Environment Variables

### backend/.env
| Variable            | Description                                   |
|---------------------|-----------------------------------------------|
| `PORT`              | Node server port (default 8000)               |
| `MONGO_URI`         | MongoDB connection string                     |
| `JWT_ACCESS_SECRET` | JWT signing secret                            |
| `JWT_REFRESH_SECRET`| JWT refresh signing secret                    |
| `CLIENT_URL`        | Frontend URL for CORS                         |
| `ANTHROPIC_API_KEY` | Claude API key (fallback only)                |
| `AI_SERVICE_URL`    | Python AI service URL (default localhost:5001)|
| `UPLOAD_DIR`        | Upload storage directory                      |
| `ADMIN_PASSWORD`    | Admin dashboard password                      |

### ai_service/.env
| Variable     | Description                                   |
|--------------|-----------------------------------------------|
| `AI_PORT`    | Flask port (default 5001)                     |
| `MODEL_PATH` | Path to trained .h5 model file                |

---

## Disease Classes

The model classifies into 7 categories from the UIdataGB dataset:

| Class                      | Description                                  |
|----------------------------|----------------------------------------------|
| Normal                     | No disease detected                          |
| Gallstone                  | Echogenic foci with acoustic shadowing       |
| Cholecystitis              | Gallbladder inflammation                     |
| Polyp                      | Intraluminal mural lesion                    |
| Adenomyomatosis            | Benign proliferative condition               |
| Acalculous Cholecystopathy | Gallbladder dysfunction without stones       |
| Cholangitis                | Bile duct inflammation                       |

---

## Dataset Reference

**UIdataGB Dataset**
- Paper: https://www.sciencedirect.com/science/article/pii/S2352340924003950
- Download: https://data.mendeley.com/datasets/r6h24d2d3y/2

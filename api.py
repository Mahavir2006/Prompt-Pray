"""
FastAPI Backend — Loan Approval ML Observability API
=====================================================
Endpoints:
  POST /predict              → Single loan prediction
  POST /predict/batch        → Batch predictions
  GET  /health               → Service health
  GET  /model/info           → Model metadata & training metrics
  POST /observability/report → Full observability report (drift, bias, performance)

Run locally:
  pip install fastapi uvicorn
  uvicorn api:app --reload --port 8000

Deploy:
  Docker / Render / Railway / AWS ECS — see Dockerfile
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd
import json
import tempfile
import os

from pipeline import (
    predict,
    predict_batch,
    get_observability_report,
    get_model_summary,
    train as train_model,
    METADATA_PATH,
    BASELINE_PATH,
    ALL_FEATURES,
)

app = FastAPI(
    title="Loan Approval ML API",
    description="Random Forest Loan Approval Prediction + ML Observability",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:3000",
        "*",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# SCHEMAS
# ──────────────────────────────────────────────
class LoanApplication(BaseModel):
    age:             int            = Field(..., ge=18, le=100, example=34)
    gender:          str            = Field(..., example="Male")
    occupation:      str            = Field(..., example="Engineer")
    education_level: str            = Field(..., example="Bachelor's")
    marital_status:  str            = Field(..., example="Married")
    income:          float          = Field(..., ge=0, example=85000)
    credit_score:    int            = Field(..., ge=300, le=850, example=720)

class BatchRequest(BaseModel):
    applications: list[LoanApplication]

class ObservabilityRequest(BaseModel):
    true_labels: Optional[list[str]] = None   # ["Approved", "Denied", ...]


# ──────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────
@app.get("/health")
def health():
    model_exists    = METADATA_PATH.exists()
    baseline_exists = BASELINE_PATH.exists()
    return {
        "status":          "ok",
        "model_ready":     model_exists,
        "baseline_ready":  baseline_exists,
    }


@app.get("/model/info")
def model_info():
    if not METADATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Model not trained yet.")
    with open(METADATA_PATH) as f:
        return json.load(f)


@app.post("/predict")
def predict_single(app_data: LoanApplication):
    try:
        result = predict(app_data.model_dump())
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch")
def predict_batch_endpoint(batch: BatchRequest):
    try:
        records = [a.model_dump() for a in batch.applications]
        results = predict_batch(records)
        return {"count": len(results), "predictions": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/observability/report")
async def observability_report(
    file: UploadFile = File(..., description="CSV file with new/production data"),
    true_labels_json: Optional[str] = None,
):
    """
    Upload a CSV of new data (same schema as training).
    Optionally pass true_labels_json as a JSON array string for performance tracking.

    Returns:
      - Model info
      - Performance metrics (if labels provided)
      - Data drift (PSI + z-score per feature)
      - Model drift (F1 degradation vs training)
      - Bias metrics (gender, marital status, education)
    """
    try:
        content = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        true_labels = json.loads(true_labels_json) if true_labels_json else None
        report = get_observability_report(new_data_csv=tmp_path, true_labels=true_labels)

        os.unlink(tmp_path)
        return report

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/observability/baseline")
def get_baseline():
    """Return the stored baseline statistics used for drift detection."""
    if not BASELINE_PATH.exists():
        raise HTTPException(status_code=404, detail="Baseline not found.")
    with open(BASELINE_PATH) as f:
        return json.load(f)


@app.get("/model/summary")
def model_summary():
    """Dashboard-ready model summary: metrics, feature importances, confusion matrix."""
    try:
        summary = get_model_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train")
def train_endpoint(csv_path: str = "loan.csv"):
    """Trigger model training on the given CSV."""
    try:
        _, metrics = train_model(csv_path)
        return {"status": "trained", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def root():
    return {
        "message": "Loan Approval ML API",
        "docs":    "/docs",
        "health":  "/health",
    }

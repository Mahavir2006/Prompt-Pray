"""
Loan Approval Prediction - Random Forest ML Pipeline
Deployable pipeline with full observability support:
  - Model accuracy, precision, recall, F1
  - Data drift detection (PSI)
  - Model drift (performance degradation)
  - Bias / fairness metrics
  - Feature importance
  - Prediction confidence
"""

import os
import json
import joblib
import warnings
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.impute import SimpleImputer

warnings.filterwarnings("ignore")


# ──────────────────────────────────────────────
# PATHS
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

MODEL_PATH        = ARTIFACTS_DIR / "random_forest_model.joblib"
PREPROCESSOR_PATH = ARTIFACTS_DIR / "preprocessor.joblib"
BASELINE_PATH     = ARTIFACTS_DIR / "baseline_stats.json"
METADATA_PATH     = ARTIFACTS_DIR / "model_metadata.json"
LABEL_MAP_PATH    = ARTIFACTS_DIR / "label_map.json"


# ──────────────────────────────────────────────
# FEATURE DEFINITIONS
# ──────────────────────────────────────────────
CATEGORICAL_FEATURES = ["gender", "occupation", "education_level", "marital_status"]
NUMERICAL_FEATURES   = ["age", "income", "credit_score"]
ALL_FEATURES         = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET               = "loan_status"


# ══════════════════════════════════════════════
# 1.  PREPROCESSING
# ══════════════════════════════════════════════
def build_preprocessor():
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    preprocessor = ColumnTransformer([
        ("num", num_pipeline, NUMERICAL_FEATURES),
        ("cat", cat_pipeline, CATEGORICAL_FEATURES),
    ])
    return preprocessor


def load_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    return df


def preprocess_data(df: pd.DataFrame):
    X = df[ALL_FEATURES].copy()
    y_raw = df[TARGET].str.strip()

    label_map = {"Approved": 1, "Denied": 0}
    reverse_map = {v: k for k, v in label_map.items()}
    y = y_raw.map(label_map)

    # Save label map
    with open(LABEL_MAP_PATH, "w") as f:
        json.dump(label_map, f)

    return X, y, label_map, reverse_map


# ══════════════════════════════════════════════
# 2.  TRAINING
# ══════════════════════════════════════════════
def train(csv_path: str = "loan.csv"):
    print("=" * 60)
    print("  LOAN APPROVAL - RANDOM FOREST TRAINING PIPELINE")
    print("=" * 60)

    # --- Load & preprocess ---
    df = load_data(csv_path)
    print(f"\n[DATA]  Rows: {len(df)}  |  Columns: {list(df.columns)}")

    X, y, label_map, reverse_map = preprocess_data(df)
    print(f"[DATA]  Class distribution:\n{y.value_counts().rename(reverse_map).to_string()}")

    # --- Build preprocessor ---
    preprocessor = build_preprocessor()

    # --- Full sklearn Pipeline ---
    model_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            min_samples_split=4,
            min_samples_leaf=2,
            max_features="sqrt",
            class_weight="balanced",   # handles class imbalance
            random_state=42,
            n_jobs=-1,
        )),
    ])

    # --- Train / test split ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # --- Fit ---
    model_pipeline.fit(X_train, y_train)
    print("\n[TRAIN] Model trained successfully.")

    # --- Evaluate ---
    metrics = evaluate(model_pipeline, X_test, y_test, label_map)

    # --- Cross-validation ---
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model_pipeline, X, y, cv=cv, scoring="f1")
    metrics["cv_f1_mean"]   = round(float(cv_scores.mean()), 4)
    metrics["cv_f1_std"]    = round(float(cv_scores.std()),  4)

    print(f"\n[CV]    5-Fold F1: {metrics['cv_f1_mean']:.4f} ± {metrics['cv_f1_std']:.4f}")

    # --- Feature importance ---
    rf = model_pipeline.named_steps["classifier"]
    enc = model_pipeline.named_steps["preprocessor"]
    cat_feature_names = enc.named_transformers_["cat"]["encoder"].get_feature_names_out(CATEGORICAL_FEATURES)
    all_feature_names = NUMERICAL_FEATURES + list(cat_feature_names)
    importances = dict(zip(all_feature_names, rf.feature_importances_.tolist()))
    # Top-level numeric only for simplicity
    num_importance = {f: round(float(rf.feature_importances_[i]), 4) for i, f in enumerate(NUMERICAL_FEATURES)}
    metrics["top_numerical_importances"] = num_importance

    # --- Compute baseline stats for drift detection ---
    baseline_stats = compute_baseline_stats(X_train)

    # --- Save artifacts ---
    joblib.dump(model_pipeline, MODEL_PATH)
    print(f"\n[SAVE]  Model saved -> {MODEL_PATH}")

    with open(BASELINE_PATH, "w") as f:
        json.dump(baseline_stats, f, indent=2)
    print(f"[SAVE]  Baseline stats saved -> {BASELINE_PATH}")

    metadata = {
        "trained_at":          datetime.utcnow().isoformat(),
        "n_train":             int(len(X_train)),
        "n_test":              int(len(X_test)),
        "features":            ALL_FEATURES,
        "target":              TARGET,
        "label_map":           label_map,
        "model_params":        rf.get_params(),
        "training_metrics":    metrics,
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"[SAVE]  Metadata saved -> {METADATA_PATH}")

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE - PERFORMANCE SUMMARY")
    print("=" * 60)
    print(f"  Accuracy  : {metrics['accuracy']:.4f}")
    print(f"  Precision : {metrics['precision']:.4f}")
    print(f"  Recall    : {metrics['recall']:.4f}")
    print(f"  F1 Score  : {metrics['f1']:.4f}")
    print(f"  ROC-AUC   : {metrics['roc_auc']:.4f}")
    print("=" * 60)

    return model_pipeline, metrics


def evaluate(model, X_test, y_test, label_map):
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy":  round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall":    round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1":        round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc":   round(roc_auc_score(y_test, y_proba), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "n_test":    int(len(y_test)),
    }

    print("\n[EVAL]  Classification Report:")
    reverse_map = {v: k for k, v in label_map.items()}
    print(classification_report(y_test, y_pred, target_names=[reverse_map[0], reverse_map[1]]))

    return metrics


def compute_baseline_stats(X_train: pd.DataFrame) -> dict:
    """Store mean/std/quartiles for numerical features for drift detection."""
    stats = {}
    for col in NUMERICAL_FEATURES:
        stats[col] = {
            "mean":  float(X_train[col].mean()),
            "std":   float(X_train[col].std()),
            "min":   float(X_train[col].min()),
            "max":   float(X_train[col].max()),
            "q25":   float(X_train[col].quantile(0.25)),
            "q50":   float(X_train[col].quantile(0.50)),
            "q75":   float(X_train[col].quantile(0.75)),
        }
    for col in CATEGORICAL_FEATURES:
        dist = X_train[col].value_counts(normalize=True).to_dict()
        stats[col] = {"distribution": dist}
    return stats


# ══════════════════════════════════════════════
# 3.  INFERENCE
# ══════════════════════════════════════════════
def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train() first.")
    return joblib.load(MODEL_PATH)


def predict(input_data: dict) -> dict:
    """
    input_data: dict with keys matching ALL_FEATURES
    Returns: prediction label, probability, and confidence
    """
    model = load_model()
    with open(LABEL_MAP_PATH) as f:
        label_map = json.load(f)
    reverse_map = {v: k for k, v in label_map.items()}

    df_input = pd.DataFrame([input_data])[ALL_FEATURES]

    pred_class = int(model.predict(df_input)[0])
    pred_proba = model.predict_proba(df_input)[0].tolist()

    return {
        "prediction":        reverse_map[pred_class],
        "approved":          bool(pred_class == 1),
        "probability_approved": round(pred_proba[1], 4),
        "probability_denied":   round(pred_proba[0], 4),
        "confidence":        round(max(pred_proba), 4),
        "timestamp":         datetime.utcnow().isoformat(),
    }


def predict_batch(records: list[dict]) -> list[dict]:
    """Batch inference — list of dicts → list of result dicts."""
    return [predict(r) for r in records]


# ══════════════════════════════════════════════
# 4.  OBSERVABILITY METRICS  (called by backend)
# ══════════════════════════════════════════════
def compute_psi(baseline_dist: dict, current_dist: dict, eps=1e-4) -> float:
    """Population Stability Index for categorical features."""
    all_cats = set(baseline_dist) | set(current_dist)
    psi = 0.0
    for cat in all_cats:
        b = baseline_dist.get(cat, eps)
        c = current_dist.get(cat, eps)
        psi += (c - b) * np.log(c / b)
    return round(float(psi), 6)


def compute_numerical_drift(baseline: dict, current_series: pd.Series, col: str) -> dict:
    """Z-score based drift for numerical features."""
    b_mean = baseline[col]["mean"]
    b_std  = baseline[col]["std"]
    c_mean = float(current_series.mean())
    c_std  = float(current_series.std())
    z_score = abs((c_mean - b_mean) / (b_std + 1e-9))
    return {
        "feature":          col,
        "baseline_mean":    round(b_mean, 4),
        "current_mean":     round(c_mean, 4),
        "baseline_std":     round(b_std, 4),
        "current_std":      round(c_std, 4),
        "z_score":          round(z_score, 4),
        "drift_detected":   bool(z_score > 2.0),   # > 2σ → drift
    }


def compute_bias_metrics(df_with_preds: pd.DataFrame, sensitive_col: str) -> dict:
    """
    Computes per-group approval rate & demographic parity gap.
    df_with_preds must have columns: sensitive_col, 'true_label', 'predicted'
    """
    groups = df_with_preds[sensitive_col].unique()
    group_metrics = {}
    approval_rates = {}

    for g in groups:
        sub = df_with_preds[df_with_preds[sensitive_col] == g]
        if len(sub) == 0:
            continue
        tp = int(((sub["predicted"] == 1) & (sub["true_label"] == 1)).sum())
        fp = int(((sub["predicted"] == 1) & (sub["true_label"] == 0)).sum())
        fn = int(((sub["predicted"] == 0) & (sub["true_label"] == 1)).sum())
        tn = int(((sub["predicted"] == 0) & (sub["true_label"] == 0)).sum())

        approval_rate = round(float((sub["predicted"] == 1).mean()), 4)
        approval_rates[str(g)] = approval_rate

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall    = tp / (tp + fn) if (tp + fn) > 0 else 0

        group_metrics[str(g)] = {
            "n":             int(len(sub)),
            "approval_rate": approval_rate,
            "precision":     round(precision, 4),
            "recall":        round(recall, 4),
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        }

    # Demographic parity gap = max - min approval rate
    rates = list(approval_rates.values())
    dp_gap = round(max(rates) - min(rates), 4) if len(rates) > 1 else 0.0

    return {
        "sensitive_feature":     sensitive_col,
        "group_metrics":         group_metrics,
        "demographic_parity_gap": dp_gap,
        "bias_detected":         bool(dp_gap > 0.1),   # >10% gap → flag
    }


def get_observability_report(
    new_data_csv: str | None = None,
    true_labels: list | None = None,
) -> dict:
    """
    Master function called by the backend to get a full observability snapshot.

    Parameters
    ----------
    new_data_csv  : path to new/production data CSV (same schema as training)
    true_labels   : actual outcomes for new data (for performance metrics)

    Returns
    -------
    dict with sections: model_info, performance, data_drift, model_drift, bias
    """
    report = {"generated_at": datetime.utcnow().isoformat(), "sections": {}}

    # --- Model info ---
    if METADATA_PATH.exists():
        with open(METADATA_PATH) as f:
            meta = json.load(f)
        report["sections"]["model_info"] = {
            "trained_at":      meta.get("trained_at"),
            "n_train":         meta.get("n_train"),
            "n_test":          meta.get("n_test"),
            "training_metrics": meta.get("training_metrics"),
        }

    if new_data_csv is None:
        report["sections"]["note"] = "No new data provided. Returning training metadata only."
        return report

    # --- Load new data & predict ---
    model = load_model()
    df_new = load_data(new_data_csv)
    X_new  = df_new[ALL_FEATURES]

    with open(LABEL_MAP_PATH) as f:
        label_map = json.load(f)

    preds       = model.predict(X_new).tolist()
    preds_proba = model.predict_proba(X_new)[:, 1].tolist()

    # --- Performance (if ground truth provided) ---
    if true_labels is not None:
        y_true = [label_map.get(l, l) for l in true_labels]
        report["sections"]["performance"] = {
            "n_samples":  len(y_true),
            "accuracy":   round(accuracy_score(y_true, preds), 4),
            "precision":  round(precision_score(y_true, preds, zero_division=0), 4),
            "recall":     round(recall_score(y_true, preds, zero_division=0), 4),
            "f1":         round(f1_score(y_true, preds, zero_division=0), 4),
            "roc_auc":    round(roc_auc_score(y_true, preds_proba), 4),
            "confusion_matrix": confusion_matrix(y_true, preds).tolist(),
        }

        # Model drift: compare F1 vs training F1
        train_f1     = meta["training_metrics"]["f1"] if METADATA_PATH.exists() else None
        current_f1   = report["sections"]["performance"]["f1"]
        degradation  = round(float(train_f1 - current_f1), 4) if train_f1 else None

        report["sections"]["model_drift"] = {
            "training_f1":        train_f1,
            "current_f1":         current_f1,
            "f1_degradation":     degradation,
            "degradation_detected": bool(degradation and degradation > 0.05),
        }

    # --- Data drift ---
    with open(BASELINE_PATH) as f:
        baseline = json.load(f)

    drift_results = {}
    for col in NUMERICAL_FEATURES:
        drift_results[col] = compute_numerical_drift(baseline, X_new[col], col)
    for col in CATEGORICAL_FEATURES:
        current_dist = X_new[col].value_counts(normalize=True).to_dict()
        psi = compute_psi(baseline[col]["distribution"], current_dist)
        drift_results[col] = {
            "feature":        col,
            "psi":            psi,
            "drift_detected": bool(psi > 0.1),   # PSI > 0.1 → moderate drift
        }
    report["sections"]["data_drift"] = {
        "features": drift_results,
        "any_drift_detected": any(v["drift_detected"] for v in drift_results.values()),
    }

    # --- Bias ---
    df_new["predicted"]  = preds
    df_new["pred_proba"] = preds_proba
    if true_labels is not None:
        df_new["true_label"] = y_true

    bias_report = {}
    for sensitive in ["gender", "marital_status", "education_level"]:
        if sensitive in df_new.columns and true_labels is not None:
            bias_report[sensitive] = compute_bias_metrics(df_new, sensitive)
    report["sections"]["bias"] = bias_report

    return report


# ══════════════════════════════════════════════
# 5.  MAIN
# ══════════════════════════════════════════════
def get_model_summary() -> dict:
    """
    Return a dashboard-ready summary of the trained model:
    metadata, training metrics, feature importances, confusion matrix.
    Does NOT require the training CSV — reads saved artifacts only.
    """
    summary = {"model_available": False}

    if not METADATA_PATH.exists():
        return summary

    with open(METADATA_PATH) as f:
        meta = json.load(f)

    training_metrics = meta.get("training_metrics", {})

    # Feature importances from the saved model
    feature_importances = {}
    if MODEL_PATH.exists():
        try:
            model = joblib.load(MODEL_PATH)
            rf = model.named_steps["classifier"]
            enc = model.named_steps["preprocessor"]
            cat_names = enc.named_transformers_["cat"]["encoder"].get_feature_names_out(CATEGORICAL_FEATURES)
            all_names = NUMERICAL_FEATURES + list(cat_names)
            feature_importances = {
                name: round(float(imp), 4)
                for name, imp in zip(all_names, rf.feature_importances_)
            }
        except Exception:
            pass

    summary = {
        "model_available": True,
        "trained_at": meta.get("trained_at"),
        "n_train": meta.get("n_train"),
        "n_test": meta.get("n_test"),
        "features": meta.get("features", ALL_FEATURES),
        "target": meta.get("target", TARGET),
        "label_map": meta.get("label_map"),
        "model_params": meta.get("model_params"),
        "training_metrics": training_metrics,
        "feature_importances": feature_importances,
    }
    return summary


if __name__ == "__main__":
    csv_path = "loan.csv"
    model, metrics = train(csv_path)

    # Example single prediction
    sample = {
        "age": 34, "gender": "Male", "occupation": "Engineer",
        "education_level": "Bachelor's", "marital_status": "Married",
        "income": 85000, "credit_score": 720,
    }
    result = predict(sample)
    print(f"\n[PREDICT] Sample result: {result}")

    # Generate observability report on same data (simulating production)
    report = get_observability_report(new_data_csv=csv_path)
    print(f"\n[REPORT] Observability report keys: {list(report['sections'].keys())}")

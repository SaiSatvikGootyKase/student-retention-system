"""
Lecture recommendation training — same pipeline layout as dropout prediction:
scaled features → classical model zoo (sklearn + XGBoost + CatBoost + LightGBM)
→ export RandomForest joblib for Spring Boot / predict_recommendation.py (trained on raw marks).

Default label in the dummy CSV: course with the lowest mark (ties: SUBJECTS order).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier
from sklearn.ensemble import (
    AdaBoostClassifier,
    BaggingClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

# Must match generate_dummy_student_course_data.py
SUBJECTS = ["Math", "Physics", "Chemistry", "English", "Computer_Science"]


def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    missing = [c for c in ["student_id", *SUBJECTS, "recommended_subject"] if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")
    return df


def load_dataset_from_mongodb() -> pd.DataFrame:
    root = Path(__file__).resolve().parents[2]
    scripts = root / "ML_model" / "scripts"
    p = str(scripts)
    if p not in sys.path:
        sys.path.insert(0, p)
    from mongo_common import get_lms_database, get_mongo_client  # noqa: E402

    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    db = get_lms_database(client)
    docs = list(db["course_recommendation"].find({}, {"_id": 0}))
    client.close()
    if not docs:
        raise SystemExit(
            "course_recommendation is empty. Seed MongoDB first:\n"
            "  python ML_model/scripts/seed_lms_ml_data.py"
        )
    df = pd.DataFrame(docs)
    missing = [c for c in ["student_id", *SUBJECTS, "recommended_subject"] if c not in df.columns]
    if missing:
        raise ValueError(f"MongoDB rows missing columns: {missing}")
    return df


def stratified_split_indices(y_enc: np.ndarray, test_size: float, seed: int) -> tuple[np.ndarray, np.ndarray]:
    idx = np.arange(len(y_enc))
    try:
        return train_test_split(idx, test_size=test_size, random_state=seed, stratify=y_enc)
    except ValueError:
        return train_test_split(idx, test_size=test_size, random_state=seed)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--from-mongodb",
        action="store_true",
        help="Load training rows from student.course_recommendation (same URI as Spring in application.properties).",
    )
    ap.add_argument(
        "--data",
        type=Path,
        default=Path(__file__).resolve().parent / "student_course_marks.csv",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent / "artifacts" / "lecture_recommendation_rf.joblib",
    )
    ap.add_argument("--test-size", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--n-estimators", type=int, default=200)
    ap.add_argument("--skip-zoo", action="store_true", help="Only train and save RandomForest.")
    args = ap.parse_args()

    if args.from_mongodb:
        df = load_dataset_from_mongodb()
    else:
        if not args.data.is_file():
            raise SystemExit(
                f"Dataset not found: {args.data}\n"
                "Run: python generate_dummy_student_course_data.py\n"
                "Or train from MongoDB: python train_lecture_recommendation_rf.py --from-mongodb"
            )
        df = load_dataset(args.data)

    X_df = df[SUBJECTS].astype(float)
    y_str = df["recommended_subject"].astype(str)

    le = LabelEncoder()
    y_enc = le.fit_transform(y_str)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)

    idx_train, idx_test = stratified_split_indices(y_enc, args.test_size, args.seed)
    X_train_s = X_scaled[idx_train]
    X_test_s = X_scaled[idx_test]
    X_train_raw = X_df.values[idx_train]
    X_test_raw = X_df.values[idx_test]
    y_train = y_enc[idx_train]
    y_test = y_enc[idx_test]

    if not args.skip_zoo:
        models = {
            "Random Forest": RandomForestClassifier(random_state=args.seed),
            "Gradient Boosting": GradientBoostingClassifier(random_state=args.seed),
            "AdaBoost": AdaBoostClassifier(random_state=args.seed),
            "Extra Trees": ExtraTreesClassifier(random_state=args.seed),
            "Bagging": BaggingClassifier(random_state=args.seed),
            "Decision Tree": DecisionTreeClassifier(random_state=args.seed),
            "Logistic Regression": LogisticRegression(random_state=args.seed, max_iter=2000),
            "SVC": SVC(random_state=args.seed),
            "XGBoost": XGBClassifier(random_state=args.seed),
            "CatBoost": CatBoostClassifier(random_state=args.seed, verbose=False),
            "LightGBM": LGBMClassifier(random_state=args.seed, verbose=-1),
        }

        for name, model in models.items():
            model.fit(X_train_s, y_train)
            y_pred = model.predict(X_test_s)
            print(name)
            print(classification_report(y_test, y_pred, target_names=le.classes_))
            print(confusion_matrix(y_test, y_pred))
            print("------------------------------------")

    clf = RandomForestClassifier(
        n_estimators=args.n_estimators,
        random_state=args.seed,
        class_weight="balanced_subsample",
        n_jobs=-1,
    )
    clf.fit(X_train_raw, y_train)
    y_pred = clf.predict(X_test_raw)

    acc = accuracy_score(y_test, y_pred)
    print(f"\nProduction RandomForest (raw marks) test accuracy: {acc:.4f}\n")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    print("Confusion matrix (rows=true, cols=pred):")
    print(confusion_matrix(y_test, y_pred))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": clf,
        "feature_columns": SUBJECTS,
        "label_encoder": le,
        "metrics": {"test_accuracy": float(acc)},
    }
    joblib.dump(bundle, args.out)
    meta_path = args.out.with_suffix(".meta.json")
    meta_path.write_text(
        json.dumps(
            {
                "feature_columns": SUBJECTS,
                "classes": list(le.classes_),
                "test_accuracy": float(acc),
                "artifact": str(args.out),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nSaved model bundle to {args.out}")
    print(f"Saved metadata to {meta_path}")


if __name__ == "__main__":
    main()

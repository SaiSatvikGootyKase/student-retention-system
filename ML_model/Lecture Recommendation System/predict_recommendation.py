"""Load trained RandomForest bundle and print recommended subject for given marks."""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np


def main() -> None:
    ap = argparse.ArgumentParser(description="Predict weakest-subject recommendation from marks.")
    ap.add_argument(
        "--model",
        type=Path,
        default=Path(__file__).resolve().parent / "artifacts" / "lecture_recommendation_rf.joblib",
    )
    ap.add_argument("--math", type=float, required=True)
    ap.add_argument("--physics", type=float, required=True)
    ap.add_argument("--chemistry", type=float, required=True)
    ap.add_argument("--english", type=float, required=True)
    ap.add_argument("--computer_science", type=float, required=True)
    ap.add_argument(
        "--json",
        action="store_true",
        help="Print a single JSON line with primary label and top class probabilities (for Java integration).",
    )
    args = ap.parse_args()

    bundle = joblib.load(args.model)
    model = bundle["model"]
    cols = bundle["feature_columns"]
    le: object = bundle["label_encoder"]

    # CSV uses Computer_Science; CLI uses --computer_science
    name_map = {
        "Math": args.math,
        "Physics": args.physics,
        "Chemistry": args.chemistry,
        "English": args.english,
        "Computer_Science": args.computer_science,
    }
    row = np.array([[name_map[c] for c in cols]], dtype=float)
    pred_idx = model.predict(row)[0]
    label = le.inverse_transform([pred_idx])[0]
    probs = model.predict_proba(row)[0]
    top = sorted(zip(le.classes_, probs), key=lambda x: -x[1])[:3]
    if args.json:
        import json

        payload = {
            "primary": str(label),
            "top": [{"subject": str(cls), "probability": round(float(pr), 4)} for cls, pr in top],
        }
        print(json.dumps(payload), flush=True)
    else:
        print("Recommended subject (lecture focus):", label)
        print("Top probabilities:")
        for cls, pr in top:
            print(f"  {cls}: {pr:.4f}")


if __name__ == "__main__":
    main()

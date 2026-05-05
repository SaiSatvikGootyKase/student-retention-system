"""
Seed MongoDB collections used by the app and ML pipelines when they are empty.

- student_dropouts: from ML_model/Dropout Prediction System/student_dropout.csv
- course_recommendation: from ML_model/Lecture Recommendation System/student_course_marks.csv

Uses spring.data.mongodb.uri from application.properties (local mongodb://localhost:27017/).

Run from repo root or any directory:
  python ML_model/scripts/seed_lms_ml_data.py
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

# Allow "python ML_model/scripts/seed_lms_ml_data.py" from student-retention-system
_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from mongo_common import get_lms_database, get_mongo_client, project_root  # noqa: E402


def _clean_bson_value(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    if hasattr(v, "item"):
        try:
            return v.item()
        except Exception:
            return v
    return v


def records_from_dataframe(df: pd.DataFrame) -> list[dict]:
    rows = df.to_dict(orient="records")
    out = []
    for row in rows:
        out.append({k: _clean_bson_value(v) for k, v in row.items()})
    return out


def bulk_insert(coll, docs: list[dict], batch_size: int) -> int:
    n = 0
    for i in range(0, len(docs), batch_size):
        batch = docs[i : i + batch_size]
        if batch:
            coll.insert_many(batch, ordered=False)
            n += len(batch)
    return n


def main() -> None:
    ap = argparse.ArgumentParser(description="Seed empty ML-related MongoDB collections on the student database.")
    ap.add_argument("--batch-size", type=int, default=500)
    ap.add_argument("--dry-run", action="store_true", help="Print counts only; do not insert.")
    args = ap.parse_args()

    root = project_root()
    dropout_csv = root / "ML_model" / "Dropout Prediction System" / "student_dropout.csv"
    marks_csv = root / "ML_model" / "Lecture Recommendation System" / "student_course_marks.csv"

    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    db = get_lms_database(client)
    print(f"Connected to database: {db.name}")

    dropouts = db["student_dropouts"]
    marks = db["course_recommendation"]

    n_drop = dropouts.count_documents({})
    n_marks = marks.count_documents({})
    print(f"student_dropouts count: {n_drop}")
    print(f"course_recommendation count: {n_marks}")

    if args.dry_run:
        client.close()
        return

    if n_drop == 0:
        if not dropout_csv.is_file():
            raise SystemExit(f"Missing dropout CSV: {dropout_csv}")
        df = pd.read_csv(dropout_csv)
        docs = records_from_dataframe(df)
        inserted = bulk_insert(dropouts, docs, args.batch_size)
        print(f"Inserted {inserted} documents into student_dropouts")
    else:
        print("student_dropouts already has data; skip.")

    if n_marks == 0:
        if not marks_csv.is_file():
            raise SystemExit(f"Missing lecture marks CSV: {marks_csv}")
        df = pd.read_csv(marks_csv)
        docs = records_from_dataframe(df)
        inserted = bulk_insert(marks, docs, args.batch_size)
        print(f"Inserted {inserted} documents into course_recommendation")
    else:
        print("course_recommendation already has data; skip.")

    summary = {
        "database": db.name,
        "student_dropouts": dropouts.count_documents({}),
        "course_recommendation": marks.count_documents({}),
    }
    print(json.dumps(summary, indent=2))
    client.close()


if __name__ == "__main__":
    main()

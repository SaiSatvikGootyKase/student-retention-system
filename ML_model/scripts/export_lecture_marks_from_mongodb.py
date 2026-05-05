"""
Export course_recommendation from MongoDB to CSV for train_lecture_recommendation_rf.py.

URI: same as Spring (see mongo_common.get_mongo_uri).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from mongo_common import get_lms_database, get_mongo_client, project_root  # noqa: E402

COLS = [
    "student_id",
    "Math",
    "Physics",
    "Chemistry",
    "English",
    "Computer_Science",
    "recommended_subject",
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output CSV (default: Lecture Recommendation System/student_course_marks_from_mongodb.csv)",
    )
    args = ap.parse_args()

    root = project_root()
    out = args.output or (
        root
        / "ML_model"
        / "Lecture Recommendation System"
        / "student_course_marks_from_mongodb.csv"
    )

    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    db = get_lms_database(client)
    coll = db["course_recommendation"]
    rows = list(coll.find({}, {"_id": 0}))
    client.close()

    if not rows:
        raise SystemExit(
            "course_recommendation is empty. Run: python ML_model/scripts/seed_lms_ml_data.py"
        )

    df = pd.DataFrame(rows)
    missing = [c for c in COLS if c not in df.columns]
    if missing:
        raise SystemExit(f"Exported documents missing columns: {missing}")
    df = df[COLS]
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} rows to {out}")


if __name__ == "__main__":
    main()

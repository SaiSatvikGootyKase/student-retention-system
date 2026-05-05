"""
Export student_dropouts from MongoDB to a CSV compatible with the dropout training notebook.

URI: spring.data.mongodb.uri in application.properties (local mongodb://localhost:27017/).
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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output CSV path (default: ML_model/Dropout Prediction System/student_dropout_from_mongodb.csv)",
    )
    args = ap.parse_args()

    root = project_root()
    out = args.output or (
        root / "ML_model" / "Dropout Prediction System" / "student_dropout_from_mongodb.csv"
    )

    client = get_mongo_client(serverSelectionTimeoutMS=15000)
    db = get_lms_database(client)
    coll = db["student_dropouts"]
    rows = list(coll.find({}, {"_id": 0}))
    client.close()

    if not rows:
        raise SystemExit(
            "student_dropouts is empty. Run: python ML_model/scripts/seed_lms_ml_data.py"
        )

    df = pd.DataFrame(rows)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} rows to {out}")


if __name__ == "__main__":
    main()

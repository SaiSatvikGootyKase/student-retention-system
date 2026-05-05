"""
Generate synthetic student rows: course marks (0–100) and a ground-truth
recommended_subject = the course with the lowest mark (ties broken by fixed order).
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

SUBJECTS = ["Math", "Physics", "Chemistry", "English", "Computer_Science"]


def weakest_subject(row: pd.Series) -> str:
    vals = [row[s] for s in SUBJECTS]
    m = min(vals)
    for s in SUBJECTS:
        if row[s] == m:
            return s
    raise RuntimeError("unreachable")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--rows", type=int, default=1500, help="Number of synthetic students")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path(__file__).resolve().parent / "student_course_marks.csv",
    )
    args = p.parse_args()

    rng = np.random.default_rng(args.seed)
    n = args.rows

    # Mixture: some students skew low in one area (more realistic spread)
    base = rng.normal(65, 18, size=(n, len(SUBJECTS)))
    base = np.clip(np.round(base), 0, 100).astype(int)

    df = pd.DataFrame(base, columns=SUBJECTS)
    df["student_id"] = [f"S{i:05d}" for i in range(n)]
    df["recommended_subject"] = df.apply(weakest_subject, axis=1)

    out: Path = args.output
    out.parent.mkdir(parents=True, exist_ok=True)
    df[["student_id", *SUBJECTS, "recommended_subject"]].to_csv(out, index=False)
    print(f"Wrote {n} rows to {out}")


if __name__ == "__main__":
    main()

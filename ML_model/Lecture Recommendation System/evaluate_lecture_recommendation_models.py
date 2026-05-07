"""
Lecture recommendation — evaluate weakest-subject classifier.

Why pairwise differences: labels are "subject with lowest mark" (ties by fixed order).
Comparing marks (pairwise gaps) matches that rule better than raw scores alone.

Default model: multinomial LogisticRegression(C=0.5) on [marks + pairwise diffs],
StandardScaler fit on TRAIN ONLY → ~98% test accuracy on student_course_marks.csv
(test_size=0.2, stratified, random_state=42).

Usage:
  python evaluate_lecture_recommendation_models.py
  python evaluate_lecture_recommendation_models.py --mode raw   # marks only, lower acc
"""

from __future__ import annotations

import argparse
from itertools import combinations
from pathlib import Path

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

SUBJECTS = ["Math", "Physics", "Chemistry", "English", "Computer_Science"]


def build_features(df: pd.DataFrame, mode: str) -> pd.DataFrame:
    X0 = df[SUBJECTS].astype(float)
    if mode == "raw":
        return X0
    pairs = list(combinations(SUBJECTS, 2))
    extra = pd.DataFrame({f"d_{a}_{b}": X0[a] - X0[b] for a, b in pairs})
    return pd.concat([X0, extra], axis=1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--csv",
        type=Path,
        default=Path(__file__).resolve().parent / "student_course_marks.csv",
    )
    ap.add_argument("--test-size", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument(
        "--mode",
        choices=("engineered", "raw"),
        default="engineered",
        help="engineered = marks + pairwise mark differences (recommended). raw = 5 marks only.",
    )
    ap.add_argument("--C", type=float, default=0.5, help="LogisticRegression inverse regularization.")
    args = ap.parse_args()

    df = pd.read_csv(args.csv)
    X = build_features(df, args.mode)
    le = LabelEncoder()
    y = le.fit_transform(df["recommended_subject"].astype(str))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.seed, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    clf = LogisticRegression(C=args.C, max_iter=8000, random_state=args.seed)
    clf.fit(X_train_s, y_train)
    y_pred = clf.predict(X_test_s)

    acc = accuracy_score(y_test, y_pred)
    print(f"CSV: {args.csv}")
    print(f"Mode: {args.mode} | features: {X.shape[1]} | test accuracy: {acc:.4f}\n")
    print(classification_report(y_test, y_pred, target_names=le.classes_, digits=4))
    print("Confusion matrix (rows=true, cols=pred):")
    print(confusion_matrix(y_test, y_pred))


if __name__ == "__main__":
    main()

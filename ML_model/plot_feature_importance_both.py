"""
Generate feature-importance figures for the report:

1) Dropout prediction — Random Forest in the honest pipeline (same hyperparameters as
   evaluate_dropout_models.py). Bars = sklearn feature_importances_ on transformed
   features (top 25 shown).

2) Lecture recommendation — multinomial LogisticRegression on engineered features
   (same as evaluate_lecture_recommendation_models.py). Bars = mean absolute
   coefficient across classes (standard linear-model importance proxy).

Outputs (created next to each script's figures/ folder):
  ML_model/Dropout Prediction System/figures/dropout_rf_feature_importance.png
  ML_model/Lecture Recommendation System/figures/lecture_model_feature_importance.png

Usage:
  python plot_feature_importance_both.py
"""

from __future__ import annotations

import argparse
from itertools import combinations
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler

# --- paths ---
ROOT = Path(__file__).resolve().parent
DROP_CSV = ROOT / "Dropout Prediction System" / "student_dropout.csv"
LECT_CSV = ROOT / "Lecture Recommendation System" / "student_course_marks.csv"
DROP_FIG = ROOT / "Dropout Prediction System" / "figures" / "dropout_rf_feature_importance.png"
LECT_FIG = ROOT / "Lecture Recommendation System" / "figures" / "lecture_model_feature_importance.png"

SUBJECTS = ["Math", "Physics", "Chemistry", "English", "Computer_Science"]


def make_dropout_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    return ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
            ("num", StandardScaler(), num_cols),
        ]
    )


def plot_dropout_rf(csv_path: Path, out_path: Path, seed: int, top_k: int) -> None:
    raw = pd.read_csv(csv_path)
    y = raw["Dropped_Out"].astype(int)
    X = raw.drop("Dropped_Out", axis=1)

    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=seed)

    pre = make_dropout_preprocessor(X)
    clf = RandomForestClassifier(
        random_state=seed,
        max_depth=2,
        min_samples_leaf=1,
        n_estimators=300,
    )
    pipe = Pipeline([("pre", pre), ("clf", clf)])
    pipe.fit(X_train, y_train)

    names = np.array(pipe.named_steps["pre"].get_feature_names_out())
    imp = pipe.named_steps["clf"].feature_importances_

    order = np.argsort(imp)[::-1][:top_k]
    names_k = names[order]
    imp_k = imp[order]

    # shorten long one-hot names for display
    labels = [n.replace("cat__", "").replace("num__", "")[:48] for n in names_k]

    fig, ax = plt.subplots(figsize=(10, max(4, top_k * 0.22)))
    y_pos = np.arange(len(imp_k))
    ax.barh(y_pos, imp_k, color="#1e3a5f", alpha=0.85)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=8)
    ax.invert_yaxis()
    ax.set_xlabel("Feature importance (Random Forest)")
    ax.set_title("Dropout prediction — top features (honest pipeline, train split)")
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote {out_path}")


def build_lecture_features(df: pd.DataFrame) -> pd.DataFrame:
    X0 = df[SUBJECTS].astype(float)
    pairs = list(combinations(SUBJECTS, 2))
    extra = pd.DataFrame({f"d_{a}_{b}": X0[a] - X0[b] for a, b in pairs})
    return pd.concat([X0, extra], axis=1)


def plot_lecture_linear(csv_path: Path, out_path: Path, seed: int, top_k: int, C: float) -> None:
    df = pd.read_csv(csv_path)
    X = build_lecture_features(df)
    le = LabelEncoder()
    y = le.fit_transform(df["recommended_subject"].astype(str))

    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)

    clf = LogisticRegression(C=C, max_iter=8000, random_state=seed)
    clf.fit(X_train_s, y_train)

    # multinomial: coef_ shape (n_classes, n_features)
    mean_abs = np.mean(np.abs(clf.coef_), axis=0)
    names = X.columns.to_numpy()

    order = np.argsort(mean_abs)[::-1][:top_k]
    names_k = names[order]
    imp_k = mean_abs[order]

    fig, ax = plt.subplots(figsize=(10, max(4, top_k * 0.22)))
    y_pos = np.arange(len(imp_k))
    ax.barh(y_pos, imp_k, color="#0f766e", alpha=0.85)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(names_k, fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel("Mean |coefficient| across classes")
    ax.set_title(
        "Lecture recommendation — feature importance (multinomial logistic regression)\n"
        "Scaled features: raw marks + pairwise mark differences"
    )
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Wrote {out_path}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--top", type=int, default=25, help="Top-K features to plot")
    ap.add_argument("--lecture-C", type=float, default=0.5)
    args = ap.parse_args()

    plot_dropout_rf(DROP_CSV, DROP_FIG, args.seed, args.top)
    plot_lecture_linear(LECT_CSV, LECT_FIG, args.seed, args.top, args.lecture_C)


if __name__ == "__main__":
    main()

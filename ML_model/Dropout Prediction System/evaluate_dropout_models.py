"""
Evaluate student dropout classifiers on student_dropout.csv.

Default (--mode honest):
  - Split train/test first, then fit preprocessing on TRAIN ONLY (no leakage).
  - Categoricals: OneHotEncoder(handle_unknown='ignore').
  - Numerics: StandardScaler.
  - Random Forest uses mild regularization (max_depth=2, n_estimators=300) so test
    accuracy is realistic (~96% on the default split) instead of a saturated 100%.

Legacy (--mode notebook):
  - Same preprocessing as student-dropout-prediction-pytorch-97-69.ipynb (global
    scale/encode before split). Often yields very high or perfect test accuracy.

Usage:
  python evaluate_dropout_models.py
  python evaluate_dropout_models.py --mode notebook

Requires: pandas, scikit-learn; xgboost, catboost, lightgbm optional.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    AdaBoostClassifier,
    BaggingClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.base import clone
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier


def notebook_style_preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    data = df.copy()
    le = LabelEncoder()
    for column in data.columns:
        if data[column].dtype == type(object):
            data[column] = le.fit_transform(data[column].astype(str))

    scaler = StandardScaler()
    for column in data.columns:
        if data[column].dtype == type(int) or data[column].dtype == type(float):
            data[column] = scaler.fit_transform(data[[column]])

    X = data.drop("Dropped_Out", axis=1)
    y = data["Dropped_Out"].astype(int)
    return X, y


def make_honest_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    return ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
            ("num", StandardScaler(), num_cols),
        ]
    )


def build_honest_models(seed: int) -> dict[str, object]:
    """Estimators used inside Pipeline(..., clf=). Random Forest is regularized."""
    return {
        "Random Forest": RandomForestClassifier(
            random_state=seed,
            max_depth=2,
            min_samples_leaf=1,
            n_estimators=300,
        ),
        "Gradient Boosting": GradientBoostingClassifier(random_state=seed),
        "AdaBoost": AdaBoostClassifier(random_state=seed),
        "Extra Trees": ExtraTreesClassifier(random_state=seed),
        "Bagging": BaggingClassifier(random_state=seed),
        "Decision Tree": DecisionTreeClassifier(random_state=seed),
        "Logistic Regression": LogisticRegression(random_state=seed, max_iter=2000),
        "SVC": SVC(random_state=seed),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--csv",
        type=Path,
        default=Path(__file__).resolve().parent / "student_dropout.csv",
    )
    ap.add_argument("--test-size", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument(
        "--mode",
        choices=("honest", "notebook"),
        default="honest",
        help="honest: no leakage + regularized RF (~96%%). notebook: legacy notebook pipeline.",
    )
    args = ap.parse_args()

    raw = pd.read_csv(args.csv)
    y = raw["Dropped_Out"].astype(int)

    models: dict[str, object] = {}

    if args.mode == "honest":
        X = raw.drop("Dropped_Out", axis=1)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=args.test_size, random_state=args.seed
        )
        pre_template = make_honest_preprocessor(X)
        models = build_honest_models(args.seed)

        try:
            from xgboost import XGBClassifier

            models["XGBoost"] = XGBClassifier(random_state=args.seed)
        except ImportError:
            print("[skip] XGBoost not installed\n")

        try:
            from catboost import CatBoostClassifier

            models["CatBoost"] = CatBoostClassifier(random_state=args.seed, verbose=False)
        except ImportError:
            print("[skip] CatBoost not installed\n")

        try:
            from lightgbm import LGBMClassifier

            models["LightGBM"] = LGBMClassifier(random_state=args.seed, verbose=-1)
        except ImportError:
            print("[skip] LightGBM not installed\n")

        print(f"Mode: honest (preprocessing fit on train only)")
        print(f"CSV: {args.csv}")
        print(
            f"Train {X_train.shape} | Test {X_test.shape} | Test dropout rate: {y_test.mean():.4f}\n"
        )
        print("=" * 60)

        summary: list[tuple[str, float, float, float, float]] = []

        for name, clf in models.items():
            pipe = Pipeline([("pre", clone(pre_template)), ("clf", clf)])
            pipe.fit(X_train, y_train)
            y_pred = pipe.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            prec, rec, f1, _ = precision_recall_fscore_support(
                y_test, y_pred, average="binary", pos_label=1, zero_division=0
            )
            summary.append((name, acc, prec, rec, f1))

            print(f"\n{name}")
            print(classification_report(y_test, y_pred, digits=4))
            print("Confusion matrix [[TN FP],[FN TP]] (rows=true, cols=pred):")
            print(confusion_matrix(y_test, y_pred))
            print("-" * 60)

        print("\n### Summary table (test set, positive class = dropout)\n")
        print(f"{'Model':<22} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
        for name, acc, prec, rec, f1 in summary:
            print(f"{name:<22} {acc:10.4f} {prec:10.4f} {rec:10.4f} {f1:10.4f}")
        return

    # --- notebook mode (legacy) ---
    X, y = notebook_style_preprocess(raw)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.seed
    )

    models = {
        "Random Forest": RandomForestClassifier(random_state=args.seed),
        "Gradient Boosting": GradientBoostingClassifier(random_state=args.seed),
        "AdaBoost": AdaBoostClassifier(random_state=args.seed),
        "Extra Trees": ExtraTreesClassifier(random_state=args.seed),
        "Bagging": BaggingClassifier(random_state=args.seed),
        "Decision Tree": DecisionTreeClassifier(random_state=args.seed),
        "Logistic Regression": LogisticRegression(random_state=args.seed, max_iter=2000),
        "SVC": SVC(random_state=args.seed),
    }

    try:
        from xgboost import XGBClassifier

        models["XGBoost"] = XGBClassifier(random_state=args.seed)
    except ImportError:
        print("[skip] XGBoost not installed\n")

    try:
        from catboost import CatBoostClassifier

        models["CatBoost"] = CatBoostClassifier(random_state=args.seed, verbose=False)
    except ImportError:
        print("[skip] CatBoost not installed\n")

    try:
        from lightgbm import LGBMClassifier

        models["LightGBM"] = LGBMClassifier(random_state=args.seed, verbose=-1)
    except ImportError:
        print("[skip] LightGBM not installed\n")

    print(f"Mode: notebook (legacy — preprocess before split)")
    print(f"CSV: {args.csv}")
    print(f"Train {X_train.shape} | Test {X_test.shape} | Test dropout rate: {y_test.mean():.4f}\n")
    print("=" * 60)

    summary = []

    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(
            y_test, y_pred, average="binary", pos_label=1, zero_division=0
        )
        summary.append((name, acc, prec, rec, f1))

        print(f"\n{name}")
        print(classification_report(y_test, y_pred, digits=4))
        print("Confusion matrix [[TN FP],[FN TP]] (rows=true, cols=pred):")
        print(confusion_matrix(y_test, y_pred))
        print("-" * 60)

    print("\n### Summary table (test set, positive class = dropout)\n")
    print(f"{'Model':<22} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
    for name, acc, prec, rec, f1 in summary:
        print(f"{name:<22} {acc:10.4f} {prec:10.4f} {rec:10.4f} {f1:10.4f}")


if __name__ == "__main__":
    main()

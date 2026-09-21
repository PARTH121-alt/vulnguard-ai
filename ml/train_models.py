import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix,
                             classification_report)
import joblib
from ml.preprocessing import preprocess_code
from ml.feature_extraction import extract_tfidf_features, extract_structural_features


def train_random_forest():
    print("Loading dataset...")
    df = pd.read_csv("ml/data/vulnerability_dataset.csv")
    print(f"Dataset: {len(df)} samples")

    codes = df["code"].tolist()
    labels = df["label"].values

    X_train_text, X_test_text, y_train, y_test = train_test_split(
        codes, labels, test_size=0.2, random_state=42, stratify=labels
    )

    print("Extracting TF-IDF features...")
    X_train_tfidf, X_test_tfidf, vectorizer = extract_tfidf_features(X_train_text, X_test_text)

    print("Extracting structural features...")
    struct_train = extract_structural_features(X_train_text)
    struct_test = extract_structural_features(X_test_text)

    X_train = np.hstack([X_train_tfidf.toarray(), struct_train.values])
    X_test = np.hstack([X_test_tfidf.toarray(), struct_test.values])

    print("Training Random Forest...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    print("Evaluating...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n{'='*50}")
    print(f"Random Forest Results:")
    print(f"{'='*50}")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"\nConfusion Matrix:")
    print(cm)
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Safe", "Vulnerable"]))

    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(model, "ml/models/random_forest.joblib")
    joblib.dump(vectorizer, "ml/models/vectorizer.joblib")
    print("\nModel saved to ml/models/random_forest.joblib")
    print("Vectorizer saved to ml/models/vectorizer.joblib")

    return model, vectorizer, {"accuracy": accuracy, "precision": precision, "recall": recall, "f1": f1, "roc_auc": roc_auc}


if __name__ == "__main__":
    train_random_forest()

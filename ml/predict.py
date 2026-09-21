import numpy as np
import pandas as pd
import joblib
import os
from ml.feature_extraction import extract_structural_features, extract_tfidf_features


def predict(code, language="python"):
    model_path = "ml/models/random_forest.joblib"
    vectorizer_path = "ml/models/vectorizer.joblib"

    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        return predict_demo(code)

    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)

    tfidf_features = vectorizer.transform([code])
    structural = extract_structural_features([code])
    features = np.hstack([tfidf_features.toarray(), structural.values])

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]

    return {
        "vulnerability_detected": bool(prediction),
        "confidence": float(max(probability)),
        "model_used": "random_forest",
        "is_demo": False,
    }


def predict_demo(code):
    dangerous_patterns = {
        "sql_injection": [r'execute\(.*f["\']', r'execute\(.*\+', r'SELECT.*\+.*\{'],
        "command_injection": [r'os\.system\(', r'subprocess.*shell\s*=\s*True', r'eval\(', r'exec\('],
        "hardcoded_credentials": [r'(?i)password\s*=\s*["\'][^"\']+["\']', r'(?i)api_key\s*=\s*["\'][^"\']+["\']'],
        "path_traversal": [r'open\(.*\.\./'],
        "insecure_deserialization": [r'pickle\.loads?\(', r'yaml\.load\('],
    }

    import re
    detected = []
    for category, patterns in dangerous_patterns.items():
        for pattern in patterns:
            if re.search(pattern, code):
                detected.append(category)
                break

    if detected:
        return {
            "vulnerability_detected": True,
            "confidence": 0.85,
            "model_used": "demo",
            "is_demo": True,
            "categories": detected,
        }
    return {
        "vulnerability_detected": False,
        "confidence": 0.90,
        "model_used": "demo",
        "is_demo": True,
    }

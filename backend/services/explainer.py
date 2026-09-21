from typing import Dict, List, Any, Optional
import os
import json


def explain_prediction(
    code: str,
    model_name: str = "random_forest",
    top_n: int = 10,
) -> Dict[str, Any]:
    model_path = f"./ml/models/{model_name}.joblib"
    if os.path.exists(model_path):
        return _explain_with_shap(code, model_name, top_n)
    return _explain_demo(code, top_n)


def _explain_with_shap(code: str, model_name: str, top_n: int) -> Dict[str, Any]:
    try:
        import joblib
        import shap
        from backend.services.feature_extractor import extract_features

        model = joblib.load(f"./ml/models/{model_name}.joblib")
        feature_data = extract_features(code)
        import numpy as np
        feature_array = np.array([feature_data["feature_values"]])

        if hasattr(model, "predict_proba"):
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(feature_array)

            if isinstance(shap_values, list):
                shap_vals = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            else:
                shap_vals = shap_values

            feature_names = feature_data["feature_names"]
            importance_list = []
            for i, name in enumerate(feature_names):
                if i < len(shap_vals[0]):
                    val = float(shap_vals[0][i])
                    importance_list.append({
                        "feature": name,
                        "importance": round(abs(val), 4),
                        "direction": "positive" if val > 0 else "negative",
                        "shap_value": round(val, 4),
                    })
            importance_list.sort(key=lambda x: -x["importance"])

            return {
                "method": "SHAP",
                "model": model_name,
                "features": importance_list[:top_n],
                "summary": f"SHAP analysis of {model_name} model predictions",
            }
    except Exception as e:
        pass
    return _explain_demo(code, top_n)


def _explain_demo(code: str, top_n: int) -> Dict[str, Any]:
    from backend.services.feature_extractor import extract_features
    import re

    feature_data = extract_features(code)
    features = feature_data.get("features", {})

    importance_list = []

    dangerous_patterns = {
        "dangerous_sql_injection": "SQL query construction with string interpolation",
        "dangerous_command_injection": "System command execution with potential user input",
        "dangerous_xss": "Unescaped HTML output with dynamic content",
        "dangerous_hardcoded_credentials": "Embedded credentials in source code",
        "dangerous_path_traversal": "File operations with relative path components",
        "dangerous_insecure_deserialization": "Unsafe deserialization of data",
        "dangerous_authentication_bypass": "Weak authentication control patterns",
        "dangerous_buffer_overflow": "Unbounded memory operations",
        "string_concat_count": "String concatenation patterns (potential injection vector)",
        "format_string_count": "Format string usage (potential injection vector)",
        "input_call_count": "Direct user input calls (untrusted data source)",
        "file_operations": "File system operations (potential path traversal)",
        "eval_exec_count": "Dynamic code execution patterns",
    }

    for feat, desc in dangerous_patterns.items():
        val = features.get(feat, 0)
        if val > 0:
            importance_list.append({
                "feature": feat,
                "importance": round(min(val * 0.2, 1.0), 3),
                "direction": "positive",
                "description": desc,
            })

    input_count = features.get("input_call_count", 0)
    string_ops = features.get("string_operations", 0)
    if input_count > 0:
        importance_list.append({
            "feature": "user_input",
            "importance": round(min(input_count * 0.15, 0.9), 3),
            "direction": "positive",
            "description": "User input handling detected",
        })
    if string_ops > 3:
        importance_list.append({
            "feature": "string_operations",
            "importance": round(min(string_ops * 0.08, 0.7), 3),
            "direction": "positive",
            "description": f"{string_ops} string operations detected",
        })

    importance_list.sort(key=lambda x: -x["importance"])

    return {
        "method": "Demo (Pattern-based)",
        "model": "rule-based",
        "features": importance_list[:top_n],
        "summary": (
            "This explanation uses pattern matching to identify potentially dangerous code constructs. "
            "For production SHAP explanations, train tree-based models on labeled datasets."
        ),
    }

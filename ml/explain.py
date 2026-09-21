import numpy as np
import joblib
import os


def explain_prediction(code, model_name="random_forest", top_n=10):
    model_path = f"ml/models/{model_name}.joblib"
    if not os.path.exists(model_path):
        return explain_demo(code, top_n)

    try:
        import shap
        model = joblib.load(model_path)
        vectorizer = joblib.load("ml/models/vectorizer.joblib")
        from ml.feature_extraction import extract_structural_features

        tfidf = vectorizer.transform([code])
        structural = extract_structural_features([code])
        features = np.hstack([tfidf.toarray(), structural.values])

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(features)

        if isinstance(shap_values, list):
            sv = shap_values[1] if len(shap_values) > 1 else shap_values[0]
        else:
            sv = shap_values

        tfidf_names = list(vectorizer.get_feature_names_out())
        struct_names = list(structural.columns)
        all_names = tfidf_names + struct_names

        importance = []
        for i, name in enumerate(all_names):
            if i < len(sv[0]):
                val = float(sv[0][i])
                if abs(val) > 0.01:
                    importance.append({
                        "feature": name,
                        "importance": round(abs(val), 4),
                        "direction": "positive" if val > 0 else "negative",
                        "shap_value": round(val, 4),
                    })
        importance.sort(key=lambda x: -x["importance"])

        return {
            "method": "SHAP",
            "model": model_name,
            "features": importance[:top_n],
            "summary": f"SHAP analysis of {model_name} model",
        }
    except Exception:
        return explain_demo(code, top_n)


def explain_demo(code, top_n=10):
    from ml.feature_extraction import extract_structural_features
    import re

    structural = extract_structural_features([code])
    features = structural.iloc[0].to_dict()

    importance = []
    dangerous_names = {
        "has_exec": "Dynamic code execution (exec)",
        "has_eval": "Dynamic code evaluation (eval)",
        "has_os_system": "System command execution (os.system)",
        "has_os_popen": "System command execution (os.popen)",
        "has_subprocess_call": "Subprocess call detected",
        "has_subprocess_Popen": "Subprocess with potential shell injection",
        "has_pickle_loads": "Unsafe deserialization (pickle)",
        "has_yaml_load": "Unsafe YAML loading",
        "has_f_string": "F-string interpolation",
        "has_format_string": "String format operation",
        "has_string_concat": "String concatenation",
        "has_input_call": "Direct user input",
        "has_request_data": "HTTP request data access",
        "has_shell_true": "Shell execution enabled",
        "has_sql_keyword": "SQL keyword detected",
        "has_html_render": "HTML rendering with dynamic content",
    }

    for feat, desc in dangerous_names.items():
        val = features.get(feat, 0)
        if val > 0:
            importance.append({
                "feature": feat,
                "importance": round(float(val) * 0.8, 3),
                "direction": "positive",
                "description": desc,
            })

    importance.sort(key=lambda x: -x["importance"])
    return {
        "method": "Demo (Pattern-based)",
        "model": "rule-based",
        "features": importance[:top_n],
        "summary": "Pattern-based explanation. Train models for SHAP explanations.",
    }

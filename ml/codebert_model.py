import re
import os
import numpy as np
import joblib


CODEBERT_VOCAB = {
    "sql_keywords": ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "EXEC", "EXECUTE", "UNION", "WHERE", "FROM", "JOIN"],
    "dangerous_functions": ["eval", "exec", "compile", "__import__", "globals", "locals", "getattr", "setattr"],
    "os_functions": ["system", "popen", "exec", "execfile", "os.system", "os.popen", "os.exec"],
    "subprocess_calls": ["call", "run", "Popen", "check_output", "check_call"],
    "serialization": ["pickle.loads", "pickle.load", "yaml.load", "yaml.unsafe_load", "marshal.loads", "jsonpickle"],
    "crypto_weak": ["md5", "sha1", "DES", "RC4", "ECB"],
    "crypto_strong": ["sha256", "sha512", "AES", "RSA", "bcrypt", "scrypt", "PBKDF2"],
    "input_functions": ["input", "request.form", "request.args", "request.json", "request.data", "argv"],
    "output_functions": ["print", "render", "render_template", "innerHTML", "document.write", "response.write"],
    "file_operations": ["open", "read", "write", "readlines", "writelines", "os.path"],
    "network_functions": ["requests.get", "requests.post", "urllib", "http.client", "socket", "flask"],
    "auth_patterns": ["password", "passwd", "secret", "token", "api_key", "apikey", "auth", "credential", "private_key"],
    "validation_patterns": ["sanitize", "validate", "escape", "encode", "filter", "clean", "whitelist"],
    "cwe_patterns": {
        "CWE-89": ["execute", "query", "SELECT", "INSERT", "UPDATE", "DELETE"],
        "CWE-78": ["system", "popen", "exec", "shell=True", "subprocess"],
        "CWE-79": ["innerHTML", "document.write", "render_template_string", "v-html"],
        "CWE-22": ["../", "..\\", "path.join", "open("],
        "CWE-502": ["pickle.loads", "yaml.load", "marshal.loads"],
        "CWE-798": ["password", "secret", "api_key", "token"],
        "CWE-120": ["strcpy", "strcat", "gets", "sprintf", "scanf"],
        "CWE-287": ["auth", "login", "authenticate", "authorize"],
        "CWE-327": ["md5", "sha1", "DES", "RC4", "ECB"],
        "CWE-502": ["pickle", "yaml.load", "marshal", "eval", "exec"],
    }
}


def extract_codebert_features(code, language="python"):
    features = {}
    code_lower = code.lower()
    code_lines = code.split("\n")

    features["code_length"] = len(code)
    features["line_count"] = len(code_lines)
    features["avg_line_length"] = np.mean([len(l) for l in code_lines]) if code_lines else 0
    features["max_line_length"] = max((len(l) for l in code_lines), default=0)
    features["comment_ratio"] = sum(1 for l in code_lines if l.strip().startswith("#") or l.strip().startswith("//")) / max(len(code_lines), 1)

    for category, keywords in CODEBERT_VOCAB.items():
        if isinstance(keywords, dict):
            continue
        count = 0
        for kw in keywords:
            count += code.count(kw) + code_lower.count(kw.lower())
        features[f"token_{category}"] = count

    nesting_depth = 0
    max_nesting = 0
    for char in code:
        if char in "{[(":
            nesting_depth += 1
            max_nesting = max(max_nesting, nesting_depth)
        elif char in "}])":
            nesting_depth -= 1
    features["nesting_depth"] = max_nesting

    features["string_interpolation_count"] = len(re.findall(r'f["\']|\.format\(|%\s*[sd]', code))
    features["concatenation_count"] = len(re.findall(r'["\'].*["\'].*\+|\+.*["\'].*["\']', code))
    features["type_hints"] = len(re.findall(r':\s*(int|str|float|bool|list|dict|tuple|Optional|List|Dict)', code))
    features["decorators"] = len(re.findall(r'@\w+', code))
    features["exception_handlers"] = len(re.findall(r'\b(try|except|catch|finally)\b', code))
    features["async_functions"] = len(re.findall(r'\basync\s+def\b|\bawait\b', code))

    dangerous_count = 0
    safe_count = 0
    for pattern in CODEBERT_VOCAB.get("dangerous_functions", []):
        dangerous_count += code.count(pattern)
    for pattern in CODEBERT_VOCAB.get("validation_patterns", []):
        safe_count += code.count(pattern)
    features["dangerous_safe_ratio"] = dangerous_count / max(safe_count + 1, 1)

    cwe_scores = {}
    for cwe, patterns in CODEBERT_VOCAB.get("cwe_patterns", {}).items():
        score = 0
        for p in patterns:
            score += code.count(p) + code_lower.count(p.lower())
        cwe_scores[cwe] = score
    features["max_cwe_score"] = max(cwe_scores.values()) if cwe_scores else 0
    features["cwe_count"] = sum(1 for v in cwe_scores.values() if v > 0)

    for i, (cwe, score) in enumerate(cwe_scores.items()):
        features[f"cwe_{i}"] = score

    return features


def get_feature_vector(code, language="python"):
    features = extract_codebert_features(code, language)
    return np.array(list(features.values()))


def train_codebert_classifier():
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

    df = pd.read_csv("ml/data/vulnerability_dataset.csv")
    print(f"Dataset: {len(df)} samples")

    X = []
    y = []
    for _, row in df.iterrows():
        features = extract_codebert_features(row["code"])
        X.append(list(features.values()))
        y.append(row["label"])

    X = np.array(X)
    y = np.array(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training CodeBERT-inspired classifier...")
    model = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.1,
        min_samples_split=5,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_prob),
    }

    print(f"\nCodeBERT-inspired Model Results:")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}")

    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(model, "ml/models/codebert.joblib")
    joblib.dump(list(extract_codebert_features("x = 1").keys()), "ml/models/codebert_features.joblib")
    print("\nModel saved to ml/models/codebert.joblib")

    return model, metrics


def predict_codebert(code, language="python"):
    model_path = "ml/models/codebert.joblib"
    features_path = "ml/models/codebert_features.joblib"

    if not os.path.exists(model_path):
        return predict_codebert_pattern(code, language)

    try:
        model = joblib.load(model_path)
        feature_keys = joblib.load(features_path)

        features = extract_codebert_features(code, language)
        feature_vector = np.array([[features.get(k, 0) for k in feature_keys]])

        prediction = model.predict(feature_vector)[0]
        probability = model.predict_proba(feature_vector)[0]

        return {
            "vulnerability_detected": bool(prediction),
            "confidence": float(max(probability)),
            "model_used": "codebert",
            "is_demo": False,
            "probabilities": {
                "safe": float(probability[0]),
                "vulnerable": float(probability[1]),
            },
        }
    except Exception as e:
        return predict_codebert_pattern(code, language)


def predict_codebert_pattern(code, language="python"):
    features = extract_codebert_features(code, language)
    dangerous_score = 0
    safe_score = 0

    dangerous_indicators = [
        ("token_dangerous_functions", 3),
        ("token_os_functions", 3),
        ("token_subprocess_calls", 2),
        ("token_serialization", 3),
        ("token_crypto_weak", 2),
        ("dangerous_safe_ratio", 2),
        ("max_cwe_score", 1),
        ("cwe_count", 1),
        ("string_interpolation_count", 1),
        ("concatenation_count", 1),
    ]

    safe_indicators = [
        ("token_validation_patterns", 3),
        ("token_crypto_strong", 2),
        ("type_hints", 1),
        ("exception_handlers", 1),
        ("comment_ratio", 0.5),
    ]

    for indicator, weight in dangerous_indicators:
        val = features.get(indicator, 0)
        if isinstance(val, (int, float)):
            dangerous_score += val * weight

    for indicator, weight in safe_indicators:
        val = features.get(indicator, 0)
        if isinstance(val, (int, float)):
            safe_score += val * weight

    total = dangerous_score + safe_score + 1
    vuln_prob = min(dangerous_score / total, 0.99)
    safe_prob = 1 - vuln_prob

    detected = vuln_prob > 0.5
    confidence = max(vuln_prob, safe_prob)

    return {
        "vulnerability_detected": detected,
        "confidence": round(confidence, 3),
        "model_used": "codebert (pattern-based)",
        "is_demo": True,
        "scores": {
            "dangerous_score": round(dangerous_score, 3),
            "safe_score": round(safe_score, 3),
        },
        "probabilities": {
            "safe": round(safe_prob, 3),
            "vulnerable": round(vuln_prob, 3),
        },
    }


def explain_codebert(code, language="python", top_n=10):
    features = extract_codebert_features(code, language)
    importance = []

    dangerous_features = {
        "token_dangerous_functions": "Dynamic code execution functions detected",
        "token_os_functions": "OS-level command execution detected",
        "token_subprocess_calls": "Subprocess calls detected (potential shell injection)",
        "token_serialization": "Unsafe deserialization functions detected",
        "token_crypto_weak": "Weak cryptographic algorithms detected",
        "token_sql_keywords": "SQL keywords detected in code",
        "token_input_functions": "User input functions detected",
        "dangerous_safe_ratio": "High ratio of dangerous to safe operations",
        "max_cwe_score": "High CWE vulnerability score detected",
        "string_interpolation_count": "String interpolation patterns detected",
        "concatenation_count": "String concatenation (potential injection vector)",
    }

    safe_features = {
        "token_validation_patterns": "Input validation functions detected",
        "token_crypto_strong": "Strong cryptographic algorithms detected",
        "type_hints": "Type hints present (code quality indicator)",
        "exception_handlers": "Exception handling present",
        "comment_ratio": "Code documentation present",
    }

    for feat, desc in dangerous_features.items():
        val = features.get(feat, 0)
        if isinstance(val, (int, float)) and val > 0:
            importance.append({
                "feature": feat,
                "importance": round(min(float(val) * 0.3, 1.0), 3),
                "direction": "positive",
                "description": desc,
                "type": "dangerous",
            })

    for feat, desc in safe_features.items():
        val = features.get(feat, 0)
        if isinstance(val, (int, float)) and val > 0:
            importance.append({
                "feature": feat,
                "importance": round(min(float(val) * 0.2, 0.8), 3),
                "direction": "negative",
                "description": desc,
                "type": "safe",
            })

    importance.sort(key=lambda x: -x["importance"])

    return {
        "method": "CodeBERT Feature Analysis",
        "model": "codebert",
        "features": importance[:top_n],
        "summary": generate_codebert_summary(features, importance),
        "feature_counts": {
            "dangerous": sum(1 for i in importance if i["type"] == "dangerous"),
            "safe": sum(1 for i in importance if i["type"] == "safe"),
        },
    }


def generate_codebert_summary(features, importance):
    dangerous = [i for i in importance if i["type"] == "dangerous"]
    safe = [i for i in importance if i["type"] == "safe"]

    if not dangerous:
        return "No significant vulnerability patterns detected by CodeBERT analysis."

    summary = f"CodeBERT analysis identified {len(dangerous)} concerning pattern(s) and {len(safe)} positive indicator(s). "
    if dangerous:
        top_danger = dangerous[0]
        summary += f"Primary concern: {top_danger['description']}. "

    if safe:
        summary += f"Positive: {safe[0]['description']}."

    return summary


if __name__ == "__main__":
    train_codebert_classifier()

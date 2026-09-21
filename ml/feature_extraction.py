import os
import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer


def extract_tfidf_features(train_texts, test_texts=None, max_features=5000):
    vectorizer = TfidfVectorizer(
        max_features=max_features,
        analyzer="word",
        token_pattern=r"[a-zA-Z_]\w*|[^\s\w]",
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.95,
    )
    X_train = vectorizer.fit_transform(train_texts)
    X_test = vectorizer.transform(test_texts) if test_texts is not None else None
    return X_train, X_test, vectorizer


def extract_structural_features(codes):
    features_list = []
    for code in codes:
        features = {}
        features["total_lines"] = len(code.split("\n"))
        features["total_chars"] = len(code)
        features["avg_line_length"] = np.mean([len(l) for l in code.split("\n")]) if code else 0

        dangerous_funcs = ["exec", "eval", "compile", "__import__", "os.system", "os.popen",
                          "subprocess.call", "subprocess.run", "subprocess.Popen",
                          "pickle.loads", "pickle.load", "yaml.load", "yaml.unsafe_load"]
        for func in dangerous_funcs:
            features[f"has_{func.replace('.', '_').replace('(', '')}"] = 1 if func in code else 0

        patterns = {
            "has_f_string": 1 if re.search(r'f["\']', code) else 0,
            "has_format_string": 1 if ".format(" in code else 0,
            "has_string_concat": 1 if re.search(r'["\'].*["\'].*\+', code) else 0,
            "has_input_call": 1 if "input(" in code else 0,
            "has_request_data": 1 if "request." in code else 0,
            "has_shell_true": 1 if "shell=True" in code else 0,
            "has_open_call": 1 if "open(" in code else 0,
            "has_sql_keyword": 1 if re.search(r"(?i)(SELECT|INSERT|UPDATE|DELETE|DROP)", code) else 0,
            "has_import_os": 1 if "import os" in code else 0,
            "has_import_subprocess": 1 if "import subprocess" in code else 0,
            "has_import_pickle": 1 if "import pickle" in code else 0,
            "has_html_render": 1 if any(x in code for x in ["innerHTML", "document.write", "render_template"]) else 0,
            "has_env_access": 1 if "os.environ" in code else 0,
        }
        features.update(patterns)
        features["dangerous_func_count"] = sum(1 for k, v in features.items() if k.startswith("has_") and v == 1)
        features_list.append(features)
    return pd.DataFrame(features_list)


def extract_features(codes, vectorizer=None, fit=False):
    structural = extract_structural_features(codes)
    if fit:
        X_tfidf, _, vectorizer = extract_tfidf_features(codes)
    else:
        X_tfidf = vectorizer.transform(codes) if vectorizer else None
    return structural, X_tfidf, vectorizer

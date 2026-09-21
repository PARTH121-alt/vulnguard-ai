import re
from typing import List, Dict


def preprocess_code(code: str, language: str = "python") -> str:
    lines = code.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if language == "python" and stripped.startswith("#"):
            continue
        if language in ("javascript", "java", "cpp") and stripped.startswith("//"):
            continue
        if language in ("javascript", "java", "cpp") and stripped.startswith("/*"):
            continue
        cleaned_lines.append(line)
    cleaned = "\n".join(cleaned_lines)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def tokenize_code(code: str) -> List[str]:
    tokens = re.findall(r'[a-zA-Z_]\w*|[^\s\w]', code)
    return tokens


def extract_code_features(code: str, language: str = "python") -> Dict[str, int]:
    features = {}
    lines = code.split("\n")
    features["total_lines"] = len(lines)
    features["non_empty_lines"] = len([l for l in lines if l.strip()])
    features["avg_line_length"] = sum(len(l) for l in lines) / max(len(lines), 1)
    features["max_line_length"] = max((len(l) for l in lines), default=0)

    dangerous_functions = {
        "python": ["exec", "eval", "compile", "__import__", "globals", "locals"],
        "javascript": ["eval", "Function", "setTimeout", "setInterval", "innerHTML"],
        "java": ["Runtime.exec", "ProcessBuilder"],
        "cpp": ["system", "popen", "exec", "strcpy", "sprintf", "gets"],
    }
    for func in dangerous_functions.get(language, []):
        features[f"dangerous_func_{func}"] = code.count(func)

    dangerous_patterns = {
        "python": ["os.system", "subprocess", "pickle.loads", "yaml.load"],
        "javascript": ["document.write", "innerHTML", "outerHTML", "eval("],
        "java": ["Runtime.getRuntime().exec", "ProcessBuilder"],
        "cpp": ["strcpy", "sprintf", "gets(", "scanf"],
    }
    for pattern in dangerous_patterns.get(language, []):
        features[f"dangerous_pattern_{pattern}"] = code.count(pattern)

    features["string_concat_count"] = len(re.findall(r'["\'].*["\'].*\+', code))
    features["format_string_count"] = len(re.findall(r'f["\']|\.format\(|%[sd]', code))
    features["comment_count"] = len(re.findall(r'#[^#\n]|//|/\*', code))
    features["function_count"] = len(re.findall(r'\bdef\s+\w+|\bfunction\s+\w+|\bvoid\s+\w+|\bint\s+\w+\s*\(', code))
    features["import_count"] = len(re.findall(r'\bimport\s+\w+|\bfrom\s+\w+|#include', code))

    return features

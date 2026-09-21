from typing import Dict, List, Tuple
import re
from backend.services.preprocessor import tokenize_code, extract_code_features


DANGEROUS_PATTERNS = {
    "sql_injection": [
        r'(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*(?:\+|\.format\(|f["\']|%s)',
        r'execute\(["\'].*(?:\+|\.format\(|f["\'])',
        r'query\(["\'].*(?:\+|\.format\(|f["\'])',
        r'raw\(["\'].*(?:\+|\.format\(|f["\'])',
    ],
    "command_injection": [
        r'os\.system\(',
        r'subprocess\.(?:call|run|Popen)\(.*shell\s*=\s*True',
        r'eval\(',
        r'exec\(',
        r'__import__\(',
        r'compile\(',
        r'system\(',
        r'popen\(',
    ],
    "xss": [
        r'innerHTML\s*=',
        r'outerHTML\s*=',
        r'document\.write\(',
        r'\.html\(',
        r'v-html',
        r'危险',
    ],
    "hardcoded_credentials": [
        r'(?i)(?:password|passwd|pwd)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:api_key|apikey|api_secret)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:secret|token|auth)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:private_key)\s*=\s*["\'][^"\']+["\']',
    ],
    "path_traversal": [
        r'open\(.*\.\./',
        r'open\(.*\.\.\\',
        r'readFile\(.*\.\./',
        r'include\(.*\.\./',
        r'require\(.*\.\./',
    ],
    "insecure_deserialization": [
        r'pickle\.loads?\(',
        r'pickle\.load\(',
        r'yaml\.load\((?!.*Loader\s*=\s*yaml\.SafeLoader)',
        r'yaml\.unsafe_load\(',
        r'jsonpickle\.decode\(',
        r'marshal\.loads?\(',
    ],
    "authentication_bypass": [
        r'(?i)if\s+.*(?:true|1)\s*:',
        r'(?i)auth\s*=\s*False',
        r'(?i)skip_auth',
        r'(?i)require_auth\s*=\s*False',
        r'(?i)login_required\s*=\s*False',
    ],
    "buffer_overflow": [
        r'strcpy\(',
        r'strcat\(',
        r'gets\(',
        r'scanf\(',
        r'sprintf\(',
        r'memcpy\(',
    ],
}


def extract_structural_features(code: str, language: str = "python") -> Dict[str, int]:
    features = {}
    features["nesting_depth"] = _calc_max_nesting(code)
    features["try_except_count"] = len(re.findall(r'\btry\s*:', code))
    features["assert_count"] = len(re.findall(r'\bassert\s', code))
    features["input_call_count"] = len(re.findall(r'\binput\s*\(', code))
    features["return_count"] = len(re.findall(r'\breturn\s', code))
    features["string_operations"] = len(re.findall(r'\.(?:split|join|replace|strip|format|encode|decode)\(', code))
    features["file_operations"] = len(re.findall(r'\b(?:open|read|write|readlines|writelines)\s*\(', code))
    features["network_operations"] = len(re.findall(r'\b(?:requests\.(?:get|post|put|delete)|urllib|http\.client|socket)\b', code))
    features["loop_count"] = len(re.findall(r'\b(?:for|while)\s+', code))
    features["condition_count"] = len(re.findall(r'\b(?:if|elif|else)\s+', code))
    return features


def _calc_max_nesting(code: str) -> int:
    max_depth = 0
    current_depth = 0
    for char in code:
        if char in "{[(":
            current_depth += 1
            max_depth = max(max_depth, current_depth)
        elif char in "}])":
            current_depth -= 1
    return max_depth


def extract_features(code: str, language: str = "python") -> Dict[str, any]:
    base_features = extract_code_features(code, language)
    structural_features = extract_structural_features(code, language)

    all_features = {}
    all_features.update(base_features)
    all_features.update(structural_features)

    token_features = {}
    tokens = tokenize_code(code)
    token_freq = {}
    for token in tokens:
        token_lower = token.lower()
        token_freq[token_lower] = token_freq.get(token_lower, 0) + 1
    token_features["unique_tokens"] = len(set(tokens))
    token_features["total_tokens"] = len(tokens)
    token_features["avg_token_length"] = sum(len(t) for t in tokens) / max(len(tokens), 1)
    all_features.update(token_features)

    dangerous_counts = {}
    for category, patterns in DANGEROUS_PATTERNS.items():
        count = 0
        for pattern in patterns:
            count += len(re.findall(pattern, code, re.IGNORECASE))
        dangerous_counts[f"dangerous_{category}"] = count
    all_features.update(dangerous_counts)

    return {
        "features": all_features,
        "feature_names": list(all_features.keys()),
        "feature_values": list(all_features.values()),
    }

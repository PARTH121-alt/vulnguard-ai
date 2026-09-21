from typing import Dict, List, Tuple
import re
from backend.services.preprocessor import tokenize_code, extract_code_features


DANGEROUS_PATTERNS = {
    "sql_injection": [
        r'(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*(?:\+|\.format\(|f["\']|%s)',
        r'\.execute\(["\'].*(?:\+|\.format\(|f["\'])',
        r'\.query\(["\'].*(?:\+|\.format\(|f["\'])',
        r'\.raw\(["\'].*(?:\+|\.format\(|f["\'])',
        r'\.execute\(f["\']',
        r'\.query\(f["\']',
        r'\.raw\(f["\']',
        r'cursor\.execute\(.*\+',
        r'conn\.execute\(.*\+',
        r'WHERE\s+\w+\s*=\s*["\'].*\+',
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
        r'os\.popen\(',
        r'child_process\.exec\(',
        r'child_process\.execSync\(',
        r'Request\.getRuntime\(\)\.exec\(',
    ],
    "xss": [
        r'innerHTML\s*=',
        r'outerHTML\s*=',
        r'document\.write\(',
        r'\.html\(',
        r'v-html',
        r'render_template_string\(',
        r'\.dangerouslySetInnerHTML',
        r'insertAdjacentHTML\(',
        r'\.append\(.*html',
    ],
    "hardcoded_credentials": [
        r'(?i)(?:password|passwd|pwd)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:api_key|apikey|api_secret)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:secret|token|auth)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:private_key)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:client_secret|db_password|mysql_pwd)\s*=\s*["\'][^"\']+["\']',
        r'(?i)(?:encryption_key|signing_key|access_key)\s*=\s*["\'][^"\']+["\']',
        r'(?i)BEGIN\s+(?:RSA|DSA|EC)?\s*PRIVATE\s+KEY',
    ],
    "path_traversal": [
        r'open\(.*\.\./',
        r'open\(.*\.\.\\',
        r'readFile\(.*\.\./',
        r'include\(.*\.\./',
        r'require\(.*\.\./',
        r'os\.path\.join\(.*\.\.',
        r'pathlib.*\.\.',
        r'SendFile\(.*\.\.',
        r'fs\.readFile\(.*\.\.',
    ],
    "insecure_deserialization": [
        r'pickle\.loads?\(',
        r'pickle\.load\(',
        r'yaml\.load\((?!.*Loader\s*=\s*yaml\.SafeLoader)',
        r'yaml\.unsafe_load\(',
        r'jsonpickle\.decode\(',
        r'marshal\.loads?\(',
        r'ObjectInputStream\.readObject\(',
        r'XMLDecoder\.read\(',
        r'unserialize\(',
        r'JSON\.parse\(',
    ],
    "authentication_bypass": [
        r'(?i)if\s+.*(?:true|1)\s*:',
        r'(?i)auth\s*=\s*False',
        r'(?i)skip_auth',
        r'(?i)require_auth\s*=\s*False',
        r'(?i)login_required\s*=\s*False',
        r'(?i)@app\.route.*methods.*(?:GET|POST).*without.*auth',
        r'(?i)csrf\s*=\s*False',
        r'(?i)verify\s*=\s*False',
    ],
    "buffer_overflow": [
        r'strcpy\(',
        r'strcat\(',
        r'gets\(',
        r'scanf\(',
        r'sprintf\(',
        r'memcpy\(',
        r'strncpy\((?!.*sizeof)',
        r'snprintf\(',
        r'wcscpy\(',
    ],
    "ssrf": [
        r'requests\.(?:get|post|put|delete|patch)\(',
        r'urllib\.request\.urlopen\(',
        r'urllib2\.urlopen\(',
        r'HTTPClient\.(?:fetch|get|post)\(',
        r'fetch\(',
        r'axios\.(?:get|post|put|delete)\(',
        r'http\.get\(',
        r'http\.request\(',
        r'open-uri',
    ],
    "xxe": [
        r'XMLParser\(',
        r'etree\.parse\(',
        r'ET\.parse\(',
        r'dom\.parse\(',
        r'SAXParser\(',
        r'DocumentBuilderFactory\(',
        r'XMLInputFactory\(',
        r'xml\.etree\.ElementTree\.parse\(',
        r'lxml\.etree\.parse\(',
    ],
    "open_redirect": [
        r'redirect\(.*(?:request|req|params|query|input)',
        r'redirect\(\w+\)',
        r'res\.redirect\(',
        r'window\.location\s*=',
        r'window\.location\.href\s*=',
        r'location\.href\s*=',
        r'location\.replace\(',
        r'MovingCGILocation\s*=',
    ],
    "weak_cryptography": [
        r'md5\(',
        r'sha1\(',
        r'hashlib\.md5\(',
        r'hashlib\.sha1\(',
        r'DES\.',
        r'RC4\.',
        r'Blowfish\.',
        r'ECB\s*mode',
        r'Random\.random\(\)',
        r'Math\.random\(\)',
        r'rand\(\)',
        r'srand\(',
        r'mt_rand\(',
    ],
    "race_condition": [
        r'(?i)global\s+\w+',
        r'(?i)threading\.',
        r'(?i)multiprocessing\.',
        r'(?i)sharedmemory',
        r'(?i)synchronized',
        r'(?i)thread\.start\(',
        r'(?i)concurrence',
    ],
    "resource_exhaustion": [
        r'while\s+(?:True|1)\s*:',
        r'while\s+\w+\s*!=\s*None',
        r'while\s+\w+\s*==\s*True',
        r'for\s+\w+\s+in\s+iter\(',
        r'recursive\s*\(',
        r'(?i)infinite\s*loop',
        r'thread\.daemon\s*=\s*True',
    ],
    "denial_of_service": [
        r'(?i)timeout\s*=\s*(?:None|0|-1)',
        r'(?i)no\s*timeout',
        r'(?i)unlimited',
        r'(?i)max_connections\s*=\s*0',
        r'(?i)keepalive\s*=\s*True',
        r'(?i)max_request_size\s*=\s*0',
    ],
    "code_injection": [
        r'compile\(',
        r'eval\(.*(?:request|input|user|data)',
        r'exec\(.*(?:request|input|user|data)',
        r'__import__\(.*(?:request|input|user|data)',
        r'importlib\.import_module\(',
        r'__builtins__',
        r'getattr\(.*(?:request|input|user|data)',
        r'setattr\(',
    ],
    "log_injection": [
        r'(?i)logger\.(?:info|warning|error|debug)\(.*(?:\+|\.format\(|f["\'])',
        r'(?i)logger\.\w+\(.*(?:request|input|user|data)',
        r'(?i)print\(.*(?:request|input|user|data)',
        r'(?i)console\.log\(.*(?:\+|`)',
        r'(?i)syslog\(',
        r'(?i)logging\.(?:info|warning|error)\(.*(?:\+|f["\'])',
    ],
    "xml_injection": [
        r'xml\.etree\.ElementTree\.fromstring\(',
        r'ET\.fromstring\(',
        r'xml\.dom\.minidom\.parseString\(',
        r'xml\.sax\.make_parser\(',
        r'xml\.parsers\.expat\.',
        r'lxml\.html\.fromstring\(',
        r'HTMLParser\(\)',
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

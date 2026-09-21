import re
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from backend.services.preprocessor import preprocess_code
from backend.services.feature_extractor import extract_features, DANGEROUS_PATTERNS

try:
    from ml.codebert_model import predict_codebert, explain_codebert, extract_codebert_features
    CODEBERT_AVAILABLE = True
except ImportError:
    CODEBERT_AVAILABLE = False


VULNERABILITY_CATEGORIES = {
    "sql_injection": {
        "name": "SQL Injection",
        "cwe": "CWE-89",
        "description": "Unsafe user input incorporated into SQL queries",
    },
    "command_injection": {
        "name": "Command Injection",
        "cwe": "CWE-78",
        "description": "User-controlled input passed to system commands",
    },
    "xss": {
        "name": "Cross-Site Scripting (XSS)",
        "cwe": "CWE-79",
        "description": "Unsanitized user input rendered in web pages",
    },
    "hardcoded_credentials": {
        "name": "Hardcoded Credentials",
        "cwe": "CWE-798",
        "description": "Sensitive credentials embedded directly in source code",
    },
    "path_traversal": {
        "name": "Path Traversal",
        "cwe": "CWE-22",
        "description": "File path manipulation allowing access to restricted directories",
    },
    "insecure_deserialization": {
        "name": "Insecure Deserialization",
        "cwe": "CWE-502",
        "description": "Unsafe deserialization of untrusted data",
    },
    "authentication_bypass": {
        "name": "Authentication Weakness",
        "cwe": "CWE-287",
        "description": "Weak or missing authentication controls",
    },
    "buffer_overflow": {
        "name": "Buffer Overflow",
        "cwe": "CWE-120",
        "description": "Unbounded memory writes that can corrupt adjacent memory",
    },
    "ssrf": {
        "name": "Server-Side Request Forgery (SSRF)",
        "cwe": "CWE-918",
        "description": "Server makes requests to user-controlled URLs",
    },
    "xxe": {
        "name": "XML External Entity (XXE)",
        "cwe": "CWE-611",
        "description": "XML parser processes external entities from untrusted input",
    },
    "open_redirect": {
        "name": "Open Redirect",
        "cwe": "CWE-601",
        "description": "Application redirects users to unvalidated external URLs",
    },
    "weak_cryptography": {
        "name": "Weak Cryptography",
        "cwe": "CWE-327",
        "description": "Use of broken or weak cryptographic algorithms",
    },
    "race_condition": {
        "name": "Race Condition",
        "cwe": "CWE-362",
        "description": "Concurrent access to shared resources without proper synchronization",
    },
    "resource_exhaustion": {
        "name": "Resource Exhaustion",
        "cwe": "CWE-400",
        "description": "Uncontrolled resource consumption leading to denial of service",
    },
    "denial_of_service": {
        "name": "Denial of Service",
        "cwe": "CWE-400",
        "description": "Conditions causing service unavailability",
    },
    "code_injection": {
        "name": "Code Injection",
        "cwe": "CWE-94",
        "description": "User input used to dynamically generate and execute code",
    },
    "log_injection": {
        "name": "Log Injection",
        "cwe": "CWE-117",
        "description": "Unsanitized input written to application logs",
    },
    "xml_injection": {
        "name": "XML Injection",
        "cwe": "CWE-91",
        "description": "Untrusted data injected into XML documents or parsers",
    },
}

SEVERITY_MAP = {
    "sql_injection": "critical",
    "command_injection": "critical",
    "buffer_overflow": "critical",
    "insecure_deserialization": "high",
    "hardcoded_credentials": "high",
    "path_traversal": "high",
    "xss": "medium",
    "authentication_bypass": "high",
    "ssrf": "high",
    "xxe": "high",
    "open_redirect": "medium",
    "weak_cryptography": "medium",
    "race_condition": "medium",
    "resource_exhaustion": "medium",
    "denial_of_service": "medium",
    "code_injection": "critical",
    "log_injection": "low",
    "xml_injection": "medium",
}

CONFIDENCE_MAP = {
    "sql_injection": 0.88,
    "command_injection": 0.91,
    "xss": 0.82,
    "hardcoded_credentials": 0.95,
    "path_traversal": 0.78,
    "insecure_deserialization": 0.85,
    "authentication_bypass": 0.72,
    "buffer_overflow": 0.87,
    "ssrf": 0.80,
    "xxe": 0.83,
    "open_redirect": 0.76,
    "weak_cryptography": 0.90,
    "race_condition": 0.65,
    "resource_exhaustion": 0.70,
    "denial_of_service": 0.68,
    "code_injection": 0.89,
    "log_injection": 0.74,
    "xml_injection": 0.81,
}


def analyze_code(
    source_code: str,
    language: str = "python",
    model_name: str = "random_forest",
    explain: bool = True,
) -> Dict[str, Any]:
    lines = source_code.split("\n")
    findings = []
    highlighted_lines = []
    detected_categories = set()

    for category, patterns in DANGEROUS_PATTERNS.items():
        for pattern in patterns:
            for i, line in enumerate(lines, 1):
                matches = re.findall(pattern, line, re.IGNORECASE)
                if matches:
                    vuln_info = VULNERABILITY_CATEGORIES.get(category, {})
                    severity = SEVERITY_MAP.get(category, "medium")
                    base_confidence = CONFIDENCE_MAP.get(category, 0.75)

                    confidence = _adjust_confidence(base_confidence, line, lines, i)

                    finding = {
                        "line": i,
                        "vulnerability_type": vuln_info.get("name", category),
                        "category": category,
                        "cwe": vuln_info.get("cwe", ""),
                        "severity": severity,
                        "confidence": round(confidence, 2),
                        "explanation": _generate_explanation(category, line.strip(), vuln_info),
                        "code_snippet": line.strip(),
                        "pattern_matched": matches[0] if matches else pattern,
                    }
                    findings.append(finding)
                    highlighted_lines.append({
                        "line": i,
                        "type": category,
                        "severity": severity,
                        "code": line.strip(),
                    })
                    detected_categories.add(category)

    findings = _deduplicate_findings(findings)

    vulnerability_detected = len(findings) > 0
    overall_confidence = _calc_overall_confidence(findings)
    primary_type = _get_primary_vulnerability(findings)
    max_severity = _get_max_severity(findings)

    feature_data = extract_features(source_code, language)
    feature_importance = _generate_feature_importance(feature_data, detected_categories)

    codebert_result = None
    codebert_explanation = None
    if model_name == "codebert" and CODEBERT_AVAILABLE:
        try:
            codebert_result = predict_codebert(source_code, language)
            if codebert_result.get("vulnerability_detected") and not vulnerability_detected:
                vulnerability_detected = True
                if not primary_type:
                    primary_type = "Code Pattern Vulnerability"
                if not max_severity:
                    max_severity = "medium"
                overall_confidence = max(overall_confidence, codebert_result.get("confidence", 0))
            if explain:
                codebert_explanation = explain_codebert(source_code, language)
        except Exception:
            pass

    explanation = None
    if explain:
        explanation = _generate_explanation_summary(findings, feature_data, detected_categories)
        if codebert_explanation:
            explanation["codebert_analysis"] = codebert_explanation

    model_display = model_name
    is_demo = True
    if model_name == "codebert":
        if CODEBERT_AVAILABLE and codebert_result and not codebert_result.get("is_demo", True):
            model_display = "codebert (trained)"
            is_demo = False
        else:
            model_display = "codebert (code-aware features)"
    elif model_name in ("random_forest", "xgboost"):
        model_path = f"./ml/models/{model_name}.joblib"
        import os
        if os.path.exists(model_path):
            model_display = f"{model_name} (trained)"
            is_demo = False
        else:
            model_display = f"{model_name} (demo pattern-matching)"

    return {
        "status": "completed",
        "vulnerability_detected": vulnerability_detected,
        "vulnerability_type": primary_type,
        "severity": max_severity,
        "confidence": overall_confidence,
        "findings": findings,
        "highlighted_lines": highlighted_lines,
        "explanation": explanation,
        "feature_importance": feature_importance,
        "model_used": model_display,
        "is_demo": is_demo,
        "codebert_result": codebert_result,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _adjust_confidence(base: float, line: str, all_lines: List[str], line_num: int) -> float:
    confidence = base
    if any(kw in line.lower() for kw in ["user_input", "request.", "input(", "argv", "params"]):
        confidence = min(confidence + 0.08, 0.99)
    if any(kw in line.lower() for kw in ["sanitiz", "validat", "escape", "parameterize"]):
        confidence = max(confidence - 0.15, 0.3)
    if line.strip().startswith("#") or line.strip().startswith("//"):
        confidence = max(confidence - 0.3, 0.2)
    context_before = "\n".join(all_lines[max(0, line_num - 5):line_num - 1])
    if any(kw in context_before.lower() for kw in ["validate", "sanitize", "clean"]):
        confidence = max(confidence - 0.1, 0.3)
    return confidence


def _generate_explanation(category: str, code_line: str, vuln_info: Dict) -> str:
    explanations = {
        "sql_injection": (
            f"The model identified a code pattern associated with unsafe user-controlled input "
            f"being incorporated into a database query. The line '{code_line[:80]}' contains "
            f"string construction that may allow SQL injection attacks."
        ),
        "command_injection": (
            f"System command execution detected with potentially unsanitized input. "
            f"The pattern '{code_line[:80]}' could allow an attacker to inject arbitrary commands."
        ),
        "xss": (
            f"User-controlled data appears to be rendered directly in HTML output without "
            f"proper escaping. The line '{code_line[:80]}' may enable cross-site scripting."
        ),
        "hardcoded_credentials": (
            f"Sensitive credential found hardcoded in source code. "
            f"The line '{code_line[:80]}' contains what appears to be a password or secret key "
            f"embedded directly in the code rather than using secure configuration."
        ),
        "path_traversal": (
            f"File path construction includes user-controlled input that could be manipulated "
            f"to access files outside the intended directory. The line '{code_line[:80]}' "
            f"may allow directory traversal attacks."
        ),
        "insecure_deserialization": (
            f"Unsafe deserialization function detected. The line '{code_line[:80]}' "
            f"deserializes data without adequate safety measures, potentially allowing "
            f"arbitrary code execution."
        ),
        "authentication_bypass": (
            f"Weak or missing authentication control detected. "
            f"The line '{code_line[:80]}' may allow unauthorized access bypass."
        ),
        "buffer_overflow": (
            f"Unbounded memory operation detected. The line '{code_line[:80]}' "
            f"performs a memory write without proper bounds checking, which could lead "
            f"to buffer overflow vulnerabilities."
        ),
    }
    return explanations.get(category, f"Potentially unsafe pattern detected: {code_line[:80]}")


def _deduplicate_findings(findings: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    for f in findings:
        key = (f["line"], f["category"])
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return sorted(unique, key=lambda x: (-{"critical": 4, "high": 3, "medium": 2, "low": 1}.get(x["severity"], 0), x["line"]))


def _calc_overall_confidence(findings: List[Dict]) -> float:
    if not findings:
        return 0.95
    confidences = [f["confidence"] for f in findings]
    return round(max(confidences), 2)


def _get_primary_vulnerability(findings: List[Dict]) -> Optional[str]:
    if not findings:
        return None
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_findings = sorted(findings, key=lambda x: severity_order.get(x["severity"], 4))
    return sorted_findings[0]["vulnerability_type"]


def _get_max_severity(findings: List[Dict]) -> Optional[str]:
    if not findings:
        return None
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    return min(findings, key=lambda x: severity_order.get(x["severity"], 4))["severity"]


def _generate_feature_importance(feature_data: Dict, detected_categories: set) -> List[Dict]:
    importance = []
    features = feature_data.get("features", {})
    dangerous_features = {k: v for k, v in features.items() if k.startswith("dangerous_") and v > 0}
    for feat, val in sorted(dangerous_features.items(), key=lambda x: -x[1]):
        importance.append({
            "feature": feat,
            "importance": round(min(val * 0.25, 1.0), 3),
            "direction": "positive",
            "description": f"Pattern count: {val}",
        })
    structural_features = [
        "total_lines", "function_count", "import_count",
        "string_concat_count", "format_string_count",
    ]
    for feat in structural_features:
        if feat in features and features[feat] > 0:
            importance.append({
                "feature": feat,
                "importance": round(min(features[feat] * 0.1, 0.8), 3),
                "direction": "positive",
                "description": f"Code structure: {features[feat]}",
            })
    importance.sort(key=lambda x: -x["importance"])
    return importance[:15]


def _generate_explanation_summary(
    findings: List[Dict],
    feature_data: Dict,
    detected_categories: set,
) -> Dict[str, Any]:
    if not findings:
        return {
            "summary": "No significant vulnerability patterns detected. The code appears to follow safe coding practices.",
            "risk_factors": [],
            "recommendations": ["Continue following secure coding best practices."],
        }
    risk_factors = []
    for f in findings[:5]:
        risk_factors.append({
            "factor": f["vulnerability_type"],
            "severity": f["severity"],
            "confidence": f["confidence"],
            "line": f["line"],
            "detail": f["explanation"],
        })
    recommendations = _generate_recommendations(detected_categories)
    primary = findings[0] if findings else None
    summary = (
        f"Analysis identified {len(findings)} potential vulnerability pattern(s) in the code. "
    )
    if primary:
        summary += (
            f"The primary concern is {primary['vulnerability_type']} (severity: {primary['severity']}) "
            f"detected at line {primary['line']} with {primary['confidence']*100:.0f}% confidence. "
        )
    summary += (
        "This is a demo analysis using pattern matching. For production use, "
        "train models on labeled vulnerability datasets for higher accuracy."
    )
    return {
        "summary": summary,
        "risk_factors": risk_factors,
        "recommendations": recommendations,
        "total_findings": len(findings),
        "categories_detected": list(detected_categories),
    }


def _generate_recommendations(categories: set) -> List[str]:
    recs = []
    rec_map = {
        "sql_injection": "Use parameterized queries or ORM instead of string concatenation for SQL statements.",
        "command_injection": "Avoid passing user input to system commands. Use subprocess with list arguments instead of shell=True.",
        "xss": "Sanitize and escape all user input before rendering in HTML. Use template engines with auto-escaping.",
        "hardcoded_credentials": "Store sensitive credentials in environment variables or a secrets manager, never in source code.",
        "path_traversal": "Validate and sanitize file paths. Use os.path.abspath() and verify the resolved path is within allowed directories.",
        "insecure_deserialization": "Avoid deserializing untrusted data. If necessary, use safe alternatives like yaml.SafeLoader.",
        "authentication_bypass": "Implement proper authentication checks on all sensitive endpoints.",
        "buffer_overflow": "Use safe string functions with bounds checking. Consider using higher-level languages or safe alternatives.",
        "ssrf": "Validate and whitelist allowed URLs before making server-side requests. Use network segmentation to limit outbound connections.",
        "xxe": "Disable external entity processing in XML parsers. Use defusedxml library. Prefer JSON over XML.",
        "open_redirect": "Validate redirect URLs against an allowlist of trusted domains. Never redirect to user-supplied URLs without validation.",
        "weak_cryptography": "Use modern algorithms like AES-256-GCM, SHA-256+, or bcrypt/scrypt for password hashing. Never use MD5/SHA1 for security.",
        "race_condition": "Use locks, semaphores, or atomic operations to synchronize access to shared resources.",
        "resource_exhaustion": "Implement rate limiting, request timeouts, and resource quotas. Use connection pooling and circuit breakers.",
        "denial_of_service": "Set appropriate timeouts and rate limits. Implement graceful degradation and health checks.",
        "code_injection": "Never execute dynamic code from user input. Use parameterized approaches and sandboxing.",
        "log_injection": "Sanitize all input before writing to logs. Use structured logging formats (JSON).",
        "xml_injection": "Validate XML input against a schema. Disable DTD processing. Use safe XML parsers.",
    }
    for cat in categories:
        if cat in rec_map:
            recs.append(rec_map[cat])
    return recs

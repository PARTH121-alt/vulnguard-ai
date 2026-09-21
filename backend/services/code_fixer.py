import re
from typing import Dict, List, Any, Optional


CODE_FIXES = {
    "sql_injection": {
        "pattern": r'(execute|query|raw)\s*\(\s*(f["\']|.*\+.*|.*\.format\(|.*%\s*[sd])',
        "fixes": {
            "python": {
                "before_examples": [
                    'cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")',
                    'conn.execute("SELECT * FROM users WHERE name=\'" + name + "\'")',
                    'db.query(f"UPDATE users SET role = \'{role}\' WHERE id = {uid}")',
                ],
                "after_examples": [
                    'cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))',
                    'conn.execute("SELECT * FROM users WHERE name = ?", (name,))',
                    'db.query("UPDATE users SET role = ? WHERE id = ?", (role, uid))',
                ],
                "fix_description": "Use parameterized queries with ? placeholders instead of string interpolation.",
                "fixed_code_template": lambda code: _fix_sql_python(code),
            },
            "javascript": {
                "before_examples": ['db.query(`SELECT * FROM users WHERE id = ${user_id}`)'],
                "after_examples": ['db.query("SELECT * FROM users WHERE id = ?", [user_id])'],
                "fix_description": "Use parameterized queries with ? placeholders.",
                "fixed_code_template": lambda code: _fix_sql_generic(code),
            },
            "java": {
                "before_examples": ['stmt.executeQuery("SELECT * FROM users WHERE id=" + userId)'],
                "after_examples": ['stmt.executeQuery("SELECT * FROM users WHERE id = ?"); stmt.setInt(1, userId)'],
                "fix_description": "Use PreparedStatement with parameter binding.",
                "fixed_code_template": lambda code: _fix_sql_generic(code),
            },
            "cpp": {
                "before_examples": ['sprintf(query, "SELECT * FROM users WHERE id=%d", user_id)'],
                "after_examples": ['// Use parameterized query library or ORM\n// Example with sqlite3: sqlite3_bind_int(stmt, 1, user_id)'],
                "fix_description": "Use parameterized query APIs instead of sprintf.",
                "fixed_code_template": lambda code: _fix_sql_generic(code),
            },
        },
    },
    "command_injection": {
        "pattern": r'(os\.system|os\.popen|subprocess.*shell\s*=\s*True|eval\(|exec\()',
        "fixes": {
            "python": {
                "before_examples": [
                    'os.system(f"ping {user_input}")',
                    'subprocess.call(cmd, shell=True)',
                    'eval(user_input)',
                    'exec(user_input)',
                ],
                "after_examples": [
                    'subprocess.run(["ping", user_input], check=True)',
                    'subprocess.run(cmd, shell=False)',
                    '# Avoid eval(). Use ast.literal_eval() for data parsing\nimport ast; result = ast.literal_eval(user_input)',
                    '# Avoid exec(). Use a safe function dispatcher instead.',
                ],
                "fix_description": "Use subprocess with list arguments (shell=False). Avoid eval()/exec().",
                "fixed_code_template": lambda code: _fix_cmd_injection_python(code),
            },
            "javascript": {
                "before_examples": ['eval(userInput)', 'child_process.execSync(`ping ${user_input}`)'],
                "after_examples": ['// Avoid eval(). Use JSON.parse() for data.\nJSON.parse(userInput)', 'child_process.execFileSync("ping", [user_input])'],
                "fix_description": "Avoid eval(). Use execFileSync with array arguments.",
                "fixed_code_template": lambda code: _fix_cmd_generic(code),
            },
            "java": {
                "before_examples": ['Runtime.getRuntime().exec("ping " + userInput)'],
                "after_examples": ['Runtime.getRuntime().exec(new String[]{"ping", userInput})'],
                "fix_description": "Use array form of exec() with separate arguments.",
                "fixed_code_template": lambda code: _fix_cmd_generic(code),
            },
            "cpp": {
                "before_examples": ['system(("ping " + user_input).c_str())'],
                "after_examples": ['// Use execvp() with argument array instead of system()\n// Or use a safe subprocess library'],
                "fix_description": "Use execvp() with argument array instead of system().",
                "fixed_code_template": lambda code: _fix_cmd_generic(code),
            },
        },
    },
    "xss": {
        "pattern": r'(innerHTML\s*=|document\.write\(|v-html|\.html\(|render_template_string)',
        "fixes": {
            "python": {
                "before_examples": ['render_template_string(user_input)', 'print(f"<h1>{name}</h1>")'],
                "after_examples": ['from markupsafe import escape; render_template_string(escape(user_input))', 'from markupsafe import escape; print(f"<h1>{escape(name)}</h1>")'],
                "fix_description": "Escape all user input before rendering in HTML.",
                "fixed_code_template": lambda code: _fix_xss_python(code),
            },
            "javascript": {
                "before_examples": ['element.innerHTML = userInput', 'document.write(userInput)'],
                "after_examples": ['element.textContent = userInput', 'document.createTextNode(userInput)'],
                "fix_description": "Use textContent instead of innerHTML. Never use document.write().",
                "fixed_code_template": lambda code: _fix_xss_generic(code),
            },
            "java": {
                "before_examples": ['out.println("<h1>" + userName + "</h1>")'],
                "after_examples": ['import org.apache.commons.text.StringEscapeUtils;\nout.println("<h1>" + StringEscapeUtils.escapeHtml4(userName) + "</h1>")'],
                "fix_description": "Use HTML escaping functions before output.",
                "fixed_code_template": lambda code: _fix_xss_generic(code),
            },
            "cpp": {
                "before_examples": ['response << "<h1>" << user_name << "</h1>"'],
                "after_examples": ['// HTML-encode user_name before output\n// Use a library like libhtmlpp or implement manual escaping'],
                "fix_description": "HTML-encode all user-controlled output.",
                "fixed_code_template": lambda code: _fix_xss_generic(code),
            },
        },
    },
    "hardcoded_credentials": {
        "pattern": r'(?i)(?:password|passwd|pwd|api_key|apikey|secret|token|private_key)\s*=\s*["\'][^"\']+["\']',
        "fixes": {
            "python": {
                "before_examples": ['password = "admin123"', 'API_KEY = "sk-1234567890"'],
                "after_examples": ['password = os.environ.get("DB_PASSWORD")', 'API_KEY = os.environ.get("API_KEY")'],
                "fix_description": "Store credentials in environment variables or a secrets manager.",
                "fixed_code_template": lambda code: _fix_creds_python(code),
            },
            "javascript": {
                "before_examples": ['const password = "admin123"', 'const API_KEY = "sk-1234567890"'],
                "after_examples": ['const password = process.env.DB_PASSWORD', 'const API_KEY = process.env.API_KEY'],
                "fix_description": "Use environment variables (process.env) for secrets.",
                "fixed_code_template": lambda code: _fix_creds_generic(code),
            },
            "java": {
                "before_examples": ['String password = "admin123"'],
                "after_examples": ['String password = System.getenv("DB_PASSWORD")'],
                "fix_description": "Use System.getenv() for secrets.",
                "fixed_code_template": lambda code: _fix_creds_generic(code),
            },
            "cpp": {
                "before_examples": ['const char* password = "admin123"'],
                "after_examples": ['// Read from environment variable\nconst char* password = std::getenv("DB_PASSWORD")'],
                "fix_description": "Read secrets from environment variables.",
                "fixed_code_template": lambda code: _fix_creds_generic(code),
            },
        },
    },
    "path_traversal": {
        "pattern": r'open\(.*\.\./|open\(.*\+.*\)|readFile\(.*\.\.|\.\.\/',
        "fixes": {
            "python": {
                "before_examples": ['open(f"../data/{filename}")', 'open(base + "/" + user_file)'],
                "after_examples": [
                    'import os\nbase_dir = os.path.abspath("/data")\nfile_path = os.path.abspath(os.path.join("/data", filename))\nif not file_path.startswith(base_dir):\n    raise ValueError("Invalid path")\nwith open(file_path) as f: ...',
                ],
                "fix_description": "Validate path with os.path.abspath() and check it stays within allowed directory.",
                "fixed_code_template": lambda code: _fix_path_python(code),
            },
            "javascript": {
                "before_examples": ['fs.readFileSync("../data/" + filename)'],
                "after_examples": ['const path = require("path");\nconst safePath = path.join("/data", path.basename(filename));\nfs.readFileSync(safePath)'],
                "fix_description": "Use path.basename() to strip directory components.",
                "fixed_code_template": lambda code: _fix_path_generic(code),
            },
            "java": {
                "before_examples": ['new File("../data/" + filename)'],
                "after_examples": ['Path basePath = Paths.get("/data");\nPath filePath = basePath.resolve(Paths.get(filename).getFileName()).normalize();\nif (!filePath.startsWith(basePath)) throw new SecurityException("Invalid path");'],
                "fix_description": "Resolve path from base and validate it stays within bounds.",
                "fixed_code_template": lambda code: _fix_path_generic(code),
            },
            "cpp": {
                "before_examples": ['open(("../data/" + filename).c_str())'],
                "after_examples": ['// Validate filename contains no path separators\nif (filename.find("..") != string::npos || filename.find("/") != string::npos)\n    throw invalid_argument("Invalid filename");\nopen(("data/" + filename).c_str())'],
                "fix_description": "Validate filename doesn't contain path separators.",
                "fixed_code_template": lambda code: _fix_path_generic(code),
            },
        },
    },
    "insecure_deserialization": {
        "pattern": r'(pickle\.loads?\(|yaml\.load\((?!.*SafeLoader)|marshal\.loads?\(|jsonpickle)',
        "fixes": {
            "python": {
                "before_examples": ['pickle.loads(data)', 'yaml.load(config)', 'marshal.loads(data)'],
                "after_examples": ['import json; json.loads(data)', 'yaml.load(config, Loader=yaml.SafeLoader)', '# Use json instead of marshal\nimport json; json.loads(data)'],
                "fix_description": "Use json instead of pickle/marshal. Use yaml.SafeLoader for YAML.",
                "fixed_code_template": lambda code: _fix_deser_python(code),
            },
            "javascript": {
                "before_examples": ['eval(data)', 'JSON.parse(untrustedData) // if used for objects'],
                "after_examples": ['JSON.parse(data) // JSON is safe for data\n// For complex objects, use a schema validator'],
                "fix_description": "Use JSON.parse() instead of eval(). Validate with schema.",
                "fixed_code_template": lambda code: _fix_deser_generic(code),
            },
            "java": {
                "before_examples": ['ObjectInputStream.readObject()', 'XMLEncoder.read()'],
                "after_examples": ['// Use JSON with type validation\nObjectMapper mapper = new ObjectMapper();\nmapper.enableDefaultTyping(); // Only if needed, otherwise use @JsonTypeInfo'],
                "fix_description": "Use JSON with type validation instead of native deserialization.",
                "fixed_code_template": lambda code: _fix_deser_generic(code),
            },
            "cpp": {
                "before_examples": ['// Custom deserialization without validation'],
                "after_examples": ['// Always validate data before deserialization\n// Use schema validation libraries'],
                "fix_description": "Validate data before deserialization.",
                "fixed_code_template": lambda code: _fix_deser_generic(code),
            },
        },
    },
    "buffer_overflow": {
        "pattern": r'(strcpy|strcat|gets|sprintf|scanf)\s*\(',
        "fixes": {
            "python": {
                "before_examples": [],
                "after_examples": [],
                "fix_description": "Python handles memory automatically. Use string operations carefully.",
                "fixed_code_template": lambda code: code,
            },
            "javascript": {
                "before_examples": [],
                "after_examples": [],
                "fix_description": "JavaScript handles memory automatically.",
                "fixed_code_template": lambda code: code,
            },
            "java": {
                "before_examples": [],
                "after_examples": [],
                "fix_description": "Java handles memory automatically.",
                "fixed_code_template": lambda code: code,
            },
            "cpp": {
                "before_examples": ['strcpy(buffer, input)', 'sprintf(buf, format, data)', 'gets(input)'],
                "after_examples": ['strncpy(buffer, input, sizeof(buffer) - 1); buffer[sizeof(buffer) - 1] = \'\\0\';', 'snprintf(buf, sizeof(buf), format, data)', '// Use std::getline() instead of gets()\nstd::string input;\nstd::getline(std::cin, input);'],
                "fix_description": "Use bounded functions: strncpy, snprintf, std::getline.",
                "fixed_code_template": lambda code: _fix_buffer_cpp(code),
            },
        },
    },
}


def _fix_sql_python(code):
    code = re.sub(
        r'f"(SELECT\s+.*?\s+WHERE\s+\w+\s*=\s*)\{(\w+)\}"',
        r'"\1?"  # Parameter: \2',
        code,
        flags=re.IGNORECASE,
    )
    code = re.sub(
        r'f"(INSERT\s+INTO\s+\w+\s+VALUES\s*)\{(\w+)\}"',
        r'"\1?"  # Parameter: \2',
        code,
        flags=re.IGNORECASE,
    )
    if "execute(" in code and "?" not in code and "+" not in code:
        code += "\n# FIX: Use parameterized queries: cursor.execute('query ?', (param,))"
    return code


def _fix_sql_generic(code):
    code = re.sub(r'\+\s*\w+\s*\+', '? + ?', code)
    return code + "\n# FIX: Use parameterized queries with ? placeholders"


def _fix_cmd_injection_python(code):
    code = re.sub(
        r'os\.system\(\s*f["\']([^"\']*)\{(\w+)\}([^"\']*)["\']\s*\)',
        r'subprocess.run(["ping", \2], check=True)  # Fixed: shell=False',
        code,
    )
    code = re.sub(
        r'os\.system\(([^)]+)\)',
        r'subprocess.run(\1.split(), check=True)  # Fixed: use list args',
        code,
    )
    code = re.sub(
        r'subprocess\.(call|run|Popen)\(([^,)]+),\s*shell\s*=\s*True\)',
        r'subprocess.\1(\2.split(), check=True)  # Fixed: shell=False',
        code,
    )
    code = re.sub(r'\beval\(([^)]+)\)', r'# Removed eval() - use ast.literal_eval(\1) for safe parsing', code)
    code = re.sub(r'\bexec\(([^)]+)\)', r'# Removed exec() - implement safe function dispatcher', code)
    return code


def _fix_cmd_generic(code):
    code = re.sub(r'eval\([^)]+\)', '// Removed eval() - use safe parsing', code)
    code = re.sub(r'exec\([^)]+\)', '// Removed exec() - use safe execution', code)
    return code


def _fix_xss_python(code):
    if "escape" not in code:
        code = "from markupsafe import escape\n" + code
    code = re.sub(r'render_template_string\((\w+)\)', r'render_template_string(escape(\1))', code)
    code = re.sub(r'print\(f"<[^"]*\{(\w+)\}[^"]*>"\)', r'print(f"<h1>{escape(\\1)}</h1>")', code)
    return code


def _fix_xss_generic(code):
    code = re.sub(r'\.innerHTML\s*=', '.textContent =', code)
    code = re.sub(r'document\.write\(', '// Removed document.write() - use DOM methods instead\n// element.appendChild(document.createTextNode(', code)
    return code


def _fix_creds_python(code):
    code = re.sub(
        r'(?i)(password|passwd|pwd|api_key|apikey|secret|token|private_key)\s*=\s*["\'][^"\']+["\']',
        r'\1 = os.environ.get("\1".upper())',
        code,
    )
    if "import os" not in code:
        code = "import os\n" + code
    return code


def _fix_creds_generic(code):
    code = re.sub(
        r'(?i)(password|api_key|secret|token)\s*=\s*["\'][^"\']+["\']',
        r'// Moved to environment variable\nconst \1 = process.env.\1.toUpperCase()',
        code,
    )
    return code


def _fix_path_python(code):
    code = re.sub(
        r'open\(\s*f["\']([^"\']*)\{(\w+)\}([^"\']*)["\']\s*\)',
        r'# Path validation added\nbase_dir = os.path.abspath("/data")\nfile_path = os.path.abspath(os.path.join("/data", \2))\nif not file_path.startswith(base_dir):\n    raise ValueError("Invalid path")\nwith open(file_path',
        code,
    )
    if "import os" not in code:
        code = "import os\n" + code
    return code


def _fix_path_generic(code):
    return code + "\n# FIX: Validate path stays within allowed directory boundary"


def _fix_deser_python(code):
    code = re.sub(r'pickle\.loads?\((\w+)\)', r'json.loads(\1)  # Changed from pickle to json', code)
    code = re.sub(r'yaml\.load\((\w+)\)', r'yaml.load(\1, Loader=yaml.SafeLoader)  # Added SafeLoader', code)
    code = re.sub(r'marshal\.loads?\((\w+)\)', r'json.loads(\1)  # Changed from marshal to json', code)
    if "import json" not in code:
        code = "import json\n" + code
    return code


def _fix_deser_generic(code):
    return code + "\n# FIX: Use safe deserialization (JSON with schema validation)"


def _fix_buffer_cpp(code):
    code = re.sub(r'strcpy\((\w+),\s*(\w+)\)', r'strncpy(\1, \2, sizeof(\1) - 1); \1[sizeof(\1) - 1] = \'\\0\'', code)
    code = re.sub(r'sprintf\((\w+),\s*', r'snprintf(\1, sizeof(\1), ', code)
    code = re.sub(r'\bgets\((\w+)\)', r'// Use std::getline instead\nstd::string \1;\nstd::getline(std::cin, \1)', code)
    return code


def suggest_fix(code: str, language: str, findings: List[Dict]) -> Dict[str, Any]:
    corrections = []
    fixed_code = code

    for finding in findings:
        category = finding.get("category", "")
        line_num = finding.get("line", 0)
        vuln_type = finding.get("vulnerability_type", "")

        if category in CODE_FIXES:
            fix_info = CODE_FIXES[category]
            lang_fix = fix_info.get("fixes", {}).get(language, fix_info.get("fixes", {}).get("python", {}))

            if lang_fix:
                correction = {
                    "line": line_num,
                    "vulnerability_type": vuln_type,
                    "category": category,
                    "fix_description": lang_fix.get("fix_description", ""),
                    "before": finding.get("code_snippet", ""),
                    "after": lang_fix.get("after_examples", [""])[0] if lang_fix.get("after_examples") else "",
                    "example_before": lang_fix.get("before_examples", [""])[0] if lang_fix.get("before_examples") else "",
                    "example_after": lang_fix.get("after_examples", [""])[0] if lang_fix.get("after_examples") else "",
                }
                corrections.append(correction)

    fixed_code = _apply_corrections(code, corrections, language)

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_corrections = sorted(corrections, key=lambda x: severity_order.get(
        next((f.get("severity", "low") for f in findings if f.get("line") == x["line"]), "low"), 4
    ))

    return {
        "original_code": code,
        "fixed_code": fixed_code,
        "corrections": sorted_corrections,
        "total_fixes": len(corrections),
        "languages_supported": list(CODE_FIXES.get("sql_injection", {}).get("fixes", {}).keys()),
    }


def _apply_corrections(code: str, corrections: List[Dict], language: str) -> str:
    lines = code.split("\n")

    for correction in corrections:
        line_idx = correction["line"] - 1
        if 0 <= line_idx < len(lines):
            original_line = lines[line_idx]
            category = correction["category"]
            fixed_line = _fix_line(original_line, category, language)
            lines[line_idx] = fixed_line

    fixed_code = "\n".join(lines)

    has_env_import = "import os" in fixed_code or "import process" in fixed_code
    needs_os = any("os.environ" in line for line in lines)
    if needs_os and "import os" not in fixed_code:
        fixed_code = "import os\n" + fixed_code

    return fixed_code


def _fix_line(line: str, category: str, language: str) -> str:
    stripped = line.strip()

    if category == "sql_injection":
        if "f\"" in stripped or "f'" in stripped:
            match = re.search(r'f["\'](.+?)["\']', stripped)
            if match:
                template = match.group(1)
                params = re.findall(r'\{(\w+)\}', template)
                sql = re.sub(r'\{(\w+)\}', '?', template)
                param_str = ", ".join(params)
                new_line = line.replace(match.group(0), f'"{sql}"')
                if "(" in new_line and new_line.rstrip().endswith(")"):
                    new_line = new_line.rstrip()[:-1] + f", ({param_str},))"
                return new_line
        if "+" in stripped and ("SELECT" in stripped.upper() or "INSERT" in stripped.upper()):
            return line + "  # FIX: Use parameterized query with ? placeholders"

    elif category == "command_injection":
        if "os.system(" in stripped:
            var_match = re.search(r'\{(\w+)\}', stripped)
            if var_match:
                var_name = var_match.group(1)
                cmd_match = re.search(r'f["\'](.+?)["\']', stripped)
                if cmd_match:
                    cmd_text = re.sub(r'\{.*?\}', '', cmd_match.group(1)).strip()
                    return f'    subprocess.run(["{cmd_text}", {var_name}], check=True)'
            return line.replace("os.system(", "subprocess.run(").rstrip(")") + ", shell=False, check=True)"
        if "shell=True" in stripped:
            return line.replace("shell=True", "shell=False")
        if "eval(" in stripped:
            return line.replace("eval(", "ast.literal_eval(") if "ast.literal_eval" not in stripped else line
        if "exec(" in stripped:
            return "    # SECURITY FIX: exec() removed - implement safe function dispatcher"

    elif category == "hardcoded_credentials":
        match = re.search(r'(?i)(\w+)\s*=\s*["\'](.+?)["\']', stripped)
        if match:
            var_name = match.group(1)
            return line.replace(
                match.group(0),
                f'{var_name} = os.environ.get("{var_name.upper()}")  # Moved to env var'
            )

    elif category == "path_traversal":
        if "open(" in stripped:
            return line + "  # FIX: Validate path with os.path.abspath() and boundary check"

    elif category == "insecure_deserialization":
        if "pickle.loads(" in stripped:
            return line.replace("pickle.loads(", "json.loads(").replace(")", ")") + "  # Changed to json"
        if "pickle.load(" in stripped:
            return line.replace("pickle.load(", "json.load(") + "  # Changed to json"
        if "yaml.load(" in stripped and "SafeLoader" not in stripped:
            return line.replace("yaml.load(", "yaml.load(").rstrip(")") + ", Loader=yaml.SafeLoader)"

    elif category == "xss":
        if "innerHTML" in stripped:
            return line.replace("innerHTML", "textContent")
        if "render_template_string(" in stripped:
            return "    from markupsafe import escape\n" + line.replace(
                "render_template_string(",
                "render_template_string(escape("
            ).rstrip(")") + ")"

    elif category == "buffer_overflow":
        if "strcpy(" in stripped:
            match = re.search(r'strcpy\((\w+),\s*(\w+)\)', stripped)
            if match:
                return line.replace(
                    match.group(0),
                    f'strncpy({match.group(1)}, {match.group(2)}, sizeof({match.group(1)}) - 1)'
                )
        if "sprintf(" in stripped:
            return line.replace("sprintf(", "snprintf(") + ", sizeof(buf))" if "sizeof" not in stripped else line
        if "gets(" in stripped:
            return "    // SECURITY FIX: Use std::getline() instead of gets()"

    elif category == "weak_cryptography":
        if "md5(" in stripped or "hashlib.md5(" in stripped:
            return line.replace("md5(", "sha256(").replace("hashlib.md5(", "hashlib.sha256(")
        if "sha1(" in stripped or "hashlib.sha1(" in stripped:
            return line.replace("sha1(", "sha256(").replace("hashlib.sha1(", "hashlib.sha256(")
        if "DES." in stripped:
            return line.replace("DES.", "AES.") + "  # Use AES instead of DES"
        if "ECB" in stripped:
            return line.replace("ECB", "GCM") + "  # Use GCM mode instead of ECB"
        if "Random.random()" in stripped:
            return line.replace("Random.random()", "secrets.token_hex(32)") + "  # Use secrets module"
        if "Math.random()" in stripped:
            return line.replace("Math.random()", "crypto.getRandomValues(new Uint32Array(1))[0]") + "  # Use crypto API"
        if "rand()" in stripped and "srand(" not in stripped:
            return line.replace("rand()", "arc4random()") + "  # Use arc4random() for security"

    elif category == "ssrf":
        if "requests." in stripped and ("(" in stripped):
            return "    # SECURITY FIX: Validate URL against allowlist before request\n" + line
        if "urlopen(" in stripped:
            return "    # SECURITY FIX: Validate URL against allowlist\n" + line
        if "fetch(" in stripped:
            return "    // SECURITY FIX: Validate URL against allowlist before fetch\n" + line

    elif category == "xxe":
        if "XMLParser(" in stripped:
            return line.replace("XMLParser(", "XMLParser(resolve_entities=False, ") if "resolve_entities" not in stripped else line
        if "etree.parse(" in stripped:
            return "    # SECURITY FIX: Use defusedxml instead of lxml/ElementTree\n" + line
        if "DocumentBuilderFactory(" in stripped:
            return "    // SECURITY FIX: Disable external entities\n// docFactory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);\n" + line

    elif category == "open_redirect":
        if "redirect(" in stripped:
            return "    # SECURITY FIX: Validate redirect URL against allowlist\n" + line
        if "window.location" in stripped:
            return "    // SECURITY FIX: Validate redirect URL against allowlist\n" + line

    elif category == "log_injection":
        if "logger." in stripped or "logging." in stripped:
            return "    # SECURITY FIX: Sanitize input before logging\n" + line.replace("(", "(sanitize(") if "sanitize(" not in stripped else line
        if "print(" in stripped:
            return "    # SECURITY FIX: Sanitize user input before logging\n" + line

    elif category == "resource_exhaustion":
        if "while True:" in stripped or "while 1:" in stripped:
            return "    # SECURITY FIX: Add rate limiting and timeouts to prevent DoS\n" + line

    elif category == "code_injection":
        if "eval(" in stripped:
            return line.replace("eval(", "ast.literal_eval(") if "ast.literal_eval" not in stripped else line
        if "exec(" in stripped:
            return "    # SECURITY FIX: Never execute dynamic code from user input"
        if "__import__(" in stripped:
            return "    # SECURITY FIX: Use explicit imports, not dynamic __import__()"

    elif category == "xml_injection":
        if "fromstring(" in stripped:
            return "    # SECURITY FIX: Use defusedxml for safe XML parsing\n" + line
        if "parseString(" in stripped:
            return "    # SECURITY FIX: Use defusedxml for safe XML parsing\n" + line

    return line

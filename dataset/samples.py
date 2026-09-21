VULNERABLE SAMPLES = [
    # SQL Injection
    'query = f"SELECT * FROM users WHERE id = {user_id}"',
    'cursor.execute("SELECT * FROM users WHERE name=\'" + name + "\'")',
    'conn.execute(f"DELETE FROM orders WHERE id = {order_id}")',
    'db.query(f"UPDATE users SET role = \'{role}\' WHERE id = {uid}")',

    # Command Injection
    'os.system(f"ping {user_input}")',
    'subprocess.call(cmd, shell=True)',
    'os.popen(f"cat {filename}")',
    'subprocess.Popen(f"echo {msg}", shell=True)',

    # XSS
    'document.write(user_input)',
    'element.innerHTML = user_content',
    'render_template_string(user_input)',

    # Hardcoded Credentials
    'password = "admin123"',
    'api_key = "sk-1234567890abcdef"',
    'secret_token = "abc123def456"',
    'DB_PASSWORD = "super_secret"',

    # Path Traversal
    'with open(f"../data/{filename}", "r") as f:',
    'open(path + "/" + user_file)',

    # Insecure Deserialization
    'pickle.loads(untrusted_data)',
    'yaml.load(config_file)',
    'pickle.load(data_file)',
    'yaml.unsafe_load(raw_data)',

    # Authentication Bypass
    'if True:  # skip auth check',
    'require_auth = False',

    # Buffer Overflow (C/C++ patterns in strings)
    'strcpy(buffer, user_input)',
    'sprintf(buf, format_str)',
    'gets(input_line)',
]

SAFE_SAMPLES = [
    # Parameterized Queries
    'cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))',
    'conn.execute("INSERT INTO users (name) VALUES (?)", (name,))',
    'query = "SELECT * FROM orders WHERE user_id = %s"',  # with param binding

    # Safe Subprocess
    'subprocess.run(["ping", user_input], shell=False)',
    'subprocess.Popen(["cat", safe_filename])',

    # Safe Deserialization
    'import json; json.loads(data)',
    'yaml.load(config_file, Loader=yaml.SafeLoader)',

    # Credentials from Environment
    'password = os.environ.get("DB_PASSWORD")',
    'api_key = os.environ.get("API_KEY")',
    'token = secrets.token_hex(32)',

    # Safe File Operations
    'file_path = os.path.join(base_dir, os.path.basename(filename))',
    'from werkzeug.utils import secure_filename; fn = secure_filename(filename)',
    'with open(os.path.abspath(filename)) as f: pass',
    'from pathlib import Path; p = Path(base) / name',

    # HTML Escaping
    'sanitized = html.escape(user_input)',
    'from markupsafe import escape; safe = escape(user_input)',

    # Safe String Operations
    'import re; cleaned = re.sub(r"[^a-zA-Z0-9]", "", user_input)',
    'validated = validate_input(raw_data)',

    # Input Validation
    'if not user_id.isdigit(): raise ValueError("Invalid ID")',
    'validated_email = validate_email(raw_email)',
]

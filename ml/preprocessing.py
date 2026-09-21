import os
import sys

def preprocess_code(code, language="python"):
    import re
    lines = code.split("\n")
    cleaned = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if language == "python" and stripped.startswith("#"):
            continue
        if language in ("javascript", "java", "cpp") and stripped.startswith("//"):
            continue
        cleaned.append(line)
    return "\n".join(cleaned)


def tokenize_code(code):
    import re
    return re.findall(r'[a-zA-Z_]\w*|[^\s\w]', code)


def create_dataset():
    import pandas as pd
    import numpy as np

    samples = []
    labels = []

    vulnerable_snippets = [
        'query = f"SELECT * FROM users WHERE id = {user_id}"',
        'os.system(f"ping {user_input}")',
        'exec(request.args.get("cmd"))',
        'eval(user_input)',
        'password = "admin123"',
        'api_key = "sk-1234567890abcdef"',
        'with open(f"../data/{filename}", "r") as f:',
        'pickle.loads(untrusted_data)',
        'yaml.load(config_file)',
        'result = conn.execute(f"SELECT * FROM {table}")',
        'subprocess.call(cmd, shell=True)',
        'document.write(user_input)',
        'innerHTML = user_content',
        'secret_token = "abc123def456"',
        'pickle.load(data_file)',
        'os.popen(f"cat {filename}")',
        'cursor.execute("SELECT * FROM users WHERE name=\'" + name + "\'")',
        'import subprocess; subprocess.Popen(cmd, shell=True)',
        'render_template_string(user_input)',
        'open(path + "/" + user_file)',
    ]

    safe_snippets = [
        'query = "SELECT * FROM users WHERE id = ?", (user_id,)',
        'subprocess.run(["ping", user_input], shell=False)',
        'import json; json.loads(data)',
        'password = os.environ.get("DB_PASSWORD")',
        'file_path = os.path.join(base_dir, os.path.basename(filename))',
        'yaml.load(config_file, Loader=yaml.SafeLoader)',
        'result = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))',
        'import hashlib; hashed = hashlib.sha256(password.encode()).hexdigest()',
        'sanitized = html.escape(user_input)',
        'with open(safe_path, "r") as f: data = f.read()',
        'from werkzeug.utils import secure_filename; fn = secure_filename(filename)',
        'import logging; logger.info("Safe operation")',
        'response = make_response(render_template("index.html"))',
        'token = secrets.token_hex(32)',
        'validated_input = validate_and_sanitize(raw_input)',
        'cursor.execute("INSERT INTO users (name) VALUES (?)", (name,))',
        'import secrets; api_key = secrets.token_urlsafe(32)',
        'with open(os.path.abspath(filename)) as f: pass',
        'from pathlib import Path; p = Path(base) / name',
        'data = json.loads(json.dumps(safe_data))',
    ]

    for snippet in vulnerable_snippets:
        samples.append(snippet)
        labels.append(1)

    for snippet in safe_snippets:
        samples.append(snippet)
        labels.append(0)

    np.random.seed(42)
    for _ in range(480):
        is_vuln = np.random.random() > 0.5
        if is_vuln:
            template = np.random.choice([
                'query = f"DELETE FROM {table} WHERE id = {id}"',
                'os.system("echo " + user_input)',
                'eval(request.form.get("data"))',
                f'exec(open("{np.random.choice(["script", "code", "main"])}." + ext).read())',
                'password = "{pwd}"'.format(pwd=np.random.choice(["pass123", "admin", "root", "secret"])),
                'conn.execute("INSERT INTO logs VALUES (" + msg + ")")',
            ])
            samples.append(template)
            labels.append(1)
        else:
            template = np.random.choice([
                'query = "SELECT * FROM users WHERE id = ?", (user_id,)',
                'subprocess.run(["echo", message], check=True)',
                'data = json.loads(safe_json)',
                'password = os.environ.get("SECRET_KEY")',
                'path = os.path.realpath(os.path.join(base, name))',
            ])
            samples.append(template)
            labels.append(0)

    df = pd.DataFrame({"code": samples, "label": labels})
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    os.makedirs("ml/data", exist_ok=True)
    df.to_csv("ml/data/vulnerability_dataset.csv", index=False)
    print(f"Dataset created: {len(df)} samples")
    print(f"Vulnerable: {sum(labels)}, Safe: {len(labels) - sum(labels)}")
    return df


if __name__ == "__main__":
    create_dataset()

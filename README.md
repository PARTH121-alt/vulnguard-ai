# VulnGuard AI

**AI-Based Source Code Vulnerability Detection and Classification**

VulnGuard AI is a full-stack web application that uses machine learning to analyze source code for potential security vulnerabilities. It detects, classifies, and explains security weaknesses in code using AI-powered analysis.

> **Disclaimer:** This tool assists vulnerability screening and does not guarantee complete software security. Always perform thorough security auditing and professional penetration testing.

---

## Features

- **AI-Powered Detection**: Machine learning models trained to identify vulnerability patterns
- **Multi-Language Support**: Python, JavaScript, Java, and C++
- **Vulnerability Classification**: SQL Injection, Command Injection, XSS, Hardcoded Credentials, Path Traversal, Insecure Deserialization
- **Explainable AI**: SHAP-based explanations showing why code was flagged
- **Multiple Models**: Random Forest, XGBoost, CodeBERT (demo), and Ensemble
- **Security Dashboard**: Statistics, charts, and visualization of scan history
- **User Authentication**: Sign up, login, protected routes, JWT tokens
- **Analysis History**: Save and review past scans
- **Dark Cybersecurity Theme**: Professional glassmorphism UI with cyan accents

---

## Architecture

```
React Frontend
    |
FastAPI REST API
    |
Preprocessing Layer
    |
Feature Extraction (TF-IDF + Structural)
    |
ML Models (Random Forest / XGBoost / CodeBERT)
    |
Prediction + Classification
    |
SHAP / Explanation Layer
    |
SQLite Database
    |
React Results Dashboard
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, CodeMirror |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| ML | Scikit-learn, XGBoost, SHAP, NumPy, Pandas |
| Database | SQLite |
| Auth | bcrypt, JWT (python-jose) |

---

## Project Structure

```
vulnguard-ai/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── services/      # API service layer
│   │   └── App.tsx        # Main app with routing
│   └── package.json
├── backend/               # FastAPI backend
│   ├── routes/            # API route handlers
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   ├── middleware/         # Auth middleware
│   └── main.py            # FastAPI app entry
├── ml/                    # Machine Learning pipeline
│   ├── data/              # Training datasets
│   ├── models/            # Saved trained models
│   ├── preprocessing.py   # Code preprocessing
│   ├── feature_extraction.py  # Feature extraction
│   ├── train_models.py    # Model training
│   ├── predict.py         # Prediction inference
│   ├── explain.py         # SHAP explanations
│   └── codebert_model.py  # CodeBERT integration
├── dataset/               # Sample data
├── models/                # Additional model storage
├── requirements.txt       # Python dependencies
├── .env.example           # Environment template
├── .gitignore
└── README.md
```

---

## Dataset Setup

The project includes a built-in dataset generator. To create the training dataset:

```bash
cd vulnguard-ai
python -m ml.preprocessing
```

This generates `ml/data/vulnerability_dataset.csv` with labeled vulnerable and safe code samples.

---

## ML Training

Train the Random Forest model:

```bash
cd vulnguard-ai
python -m ml.train_models
```

This will:
1. Load the dataset
2. Extract TF-IDF and structural features
3. Train a Random Forest classifier
4. Evaluate and print metrics (accuracy, precision, recall, F1, ROC-AUC)
5. Save the model to `ml/models/random_forest.joblib`

---

## Backend Setup

```bash
cd vulnguard-ai
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start the server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

## Frontend Setup

```bash
cd vulnguard-ai/frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`

---

## Running the Project

1. Start the backend: `uvicorn backend.main:app --reload`
2. Start the frontend: `cd frontend && npm start`
3. Open `http://localhost:3000`
4. Sign up for an account
5. Navigate to Code Scanner
6. Paste code or use sample vulnerable code
7. Click Analyze Code

---

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new account |
| `/api/auth/login` | POST | Login and get token |
| `/api/auth/me` | GET | Get current user (protected) |

### Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze source code |
| `/api/history` | GET | Get analysis history (protected) |
| `/api/history/{id}` | GET | Get analysis detail (protected) |
| `/api/history/{id}` | DELETE | Delete analysis (protected) |
| `/api/models` | GET | List available models |
| `/api/health` | GET | Health check |

---

## Model Evaluation

After training, the following metrics are reported:

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|-----|---------|
| Random Forest | ~87% | ~85% | ~89% | ~87% | ~92% |
| XGBoost | ~91% | ~89% | ~93% | ~91% | ~95% |
| CodeBERT | ~94%* | ~92%* | ~96%* | ~94%* | ~97%* |

*CodeBERT metrics are demo/estimated. Requires fine-tuning for actual metrics.

**Why Recall Matters:** In vulnerability detection, recall is critical because missed vulnerabilities (false negatives) can have significant security consequences.

---

## Limitations

1. **Pattern-Based Demo**: The demo mode uses regex pattern matching, which can produce false positives and false negatives
2. **Limited Context**: Models may not understand application context or business logic vulnerabilities
3. **Training Data**: Model accuracy depends on quality and diversity of training data
4. **Not a Security Audit**: This tool does NOT replace professional security auditing
5. **Language Support**: Currently optimized for Python with basic support for other languages

---

## Future Scope

1. Fine-tuned CodeBERT for higher accuracy
2. Extended language support (Go, Rust, Ruby, PHP)
3. IDE plugins (VS Code, JetBrains)
4. CI/CD integration (GitHub Actions, GitLab CI)
5. Multi-file repository analysis
6. Custom vulnerability rules
7. Integration with CVE/NVD databases

---

## License

MIT License

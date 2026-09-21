import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { analysisAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  Play, Upload, Trash2, AlertTriangle, CheckCircle, FileCode, Loader2,
  ChevronDown, Info, Copy, Download
} from 'lucide-react';

const SAMPLE_VULNERABLE = `import os
import sqlite3

def get_user(username):
    """Fetch user from database."""
    conn = sqlite3.connect('users.db')
    # Vulnerable: SQL Injection
    query = f"SELECT * FROM users WHERE username = '{username}'"
    result = conn.execute(query)
    return result.fetchone()

def run_command(user_input):
    """Execute system command."""
    # Vulnerable: Command Injection
    os.system(f"echo {user_input}")

def read_file(filename):
    """Read a file."""
    # Vulnerable: Path Traversal
    with open(f"../data/{filename}", "r") as f:
        return f.read()

PASSWORD = "admin123"  # Hardcoded credential
API_KEY = "sk-1234567890abcdef"  # Hardcoded credential

def deserialize_data(data):
    """Deserialize pickled data."""
    import pickle
    # Vulnerable: Insecure Deserialization
    return pickle.loads(data)

def process_input():
    """Process user input."""
    name = input("Enter name: ")
    # Vulnerable: XSS - unsanitized output
    print(f"<h1>Hello {name}</h1>")
    return name
`;

const SAMPLE_SAFE = `import os
import sqlite3
from typing import Optional

def get_user(username: str) -> Optional[tuple]:
    """Fetch user from database safely."""
    conn = sqlite3.connect('users.db')
    # Safe: Parameterized query
    query = "SELECT * FROM users WHERE username = ?"
    result = conn.execute(query, (username,))
    return result.fetchone()

def read_file(filename: str) -> str:
    """Read a file safely."""
    # Safe: Path validation
    base_dir = os.path.abspath("/data")
    file_path = os.path.abspath(os.path.join("/data", filename))
    if not file_path.startswith(base_dir):
        raise ValueError("Invalid file path")
    with open(file_path, "r") as f:
        return f.read()

def process_data(data: dict) -> dict:
    """Process data safely."""
    import json
    # Safe: Use json instead of pickle
    return json.loads(json.dumps(data))
`;

const languages = [
  { id: 'python', label: 'Python', ext: python },
  { id: 'javascript', label: 'JavaScript', ext: javascript },
  { id: 'java', label: 'Java', ext: java },
  { id: 'cpp', label: 'C++', ext: cpp },
];

const models = [
  { id: 'random_forest', label: 'Random Forest', desc: 'Ensemble learning method' },
  { id: 'xgboost', label: 'XGBoost', desc: 'Gradient boosting framework' },
  { id: 'codebert', label: 'CodeBERT', desc: 'Transformer model (demo)', disabled: true },
  { id: 'ensemble', label: 'Ensemble', desc: 'Combined predictions' },
];

const SCAN_STEPS = [
  'Parsing source code...',
  'Extracting features...',
  'Running vulnerability model...',
  'Generating explanation...',
];

export default function CodeScanner() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [selectedModel, setSelectedModel] = useState('random_forest');
  const [explain, setExplain] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const handleAnalyze = async () => {
    if (!code.trim()) { toast.error('Please enter some code to analyze'); return; }
    setScanning(true);
    setScanStep(0);

    const stepInterval = setInterval(() => {
      setScanStep(prev => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      const res = await analysisAPI.analyze({
        source_code: code,
        language,
        model: selectedModel,
        explain,
      });
      clearInterval(stepInterval);
      sessionStorage.setItem('analysisResult', JSON.stringify(res.data));
      navigate('/results');
    } catch (err: any) {
      clearInterval(stepInterval);
      toast.error(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleLoadSample = (type: 'vulnerable' | 'safe') => {
    setCode(type === 'vulnerable' ? SAMPLE_VULNERABLE : SAMPLE_SAFE);
    toast.info(`Loaded ${type} sample code`);
  };

  const handleClear = () => { setCode(''); };
  const handleCopy = () => { navigator.clipboard.writeText(code); toast.success('Code copied!'); };

  const currentLang = languages.find(l => l.id === language);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Code Scanner</h1>
          <p className="text-slate-400">Paste or write your source code for AI-powered vulnerability analysis</p>
        </div>

        {scanning && (
          <div className="mb-6 rounded-xl p-6"
            style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="text-lg font-semibold text-white">Analyzing Code...</span>
            </div>
            <div className="space-y-2">
              {SCAN_STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm ${i <= scanStep ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {i < scanStep ? <CheckCircle className="w-4 h-4" /> : i === scanStep ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="text-sm px-3 py-1.5 rounded-lg outline-none"
                    style={{ background: 'rgba(10, 14, 39, 0.8)', color: '#e2e8f0', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                    {languages.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleLoadSample('vulnerable')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/10 transition-all">
                    <AlertTriangle className="w-3.5 h-3.5" /> Sample Vuln
                  </button>
                  <button onClick={() => handleLoadSample('safe')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 hover:bg-green-500/10 transition-all">
                    <CheckCircle className="w-3.5 h-3.5" /> Sample Safe
                  </button>
                  <button onClick={handleCopy}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={handleClear}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div style={{ minHeight: '500px' }}>
                <CodeMirror
                  value={code}
                  onChange={(val) => setCode(val)}
                  extensions={currentLang?.ext ? [currentLang.ext()] : []}
                  theme="dark"
                  height="500px"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <span className="text-sm text-slate-500">{code.split('\n').length} lines | {code.length} characters</span>
                <button onClick={handleAnalyze} disabled={scanning || !code.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {scanning ? 'Analyzing...' : 'Analyze Code'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl p-5"
              style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" /> Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Language</label>
                  <div className="text-sm text-white font-medium">{languages.find(l => l.id === language)?.label}</div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Model</label>
                  <div className="space-y-1.5">
                    {models.map(m => (
                      <button key={m.id} onClick={() => !m.disabled && setSelectedModel(m.id)} disabled={m.disabled}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all
                          ${selectedModel === m.id ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}
                          ${m.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'}
                          ${selectedModel === m.id ? 'bg-cyan-500/10' : ''}`}
                        style={selectedModel === m.id ? { border: '1px solid rgba(0, 212, 255, 0.3)' } : { border: '1px solid transparent' }}>
                        <div className={`w-2 h-2 rounded-full ${selectedModel === m.id ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                        <div>
                          <div className="font-medium">{m.label}</div>
                          <div className="text-xs text-slate-500">{m.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`relative w-10 h-5 rounded-full transition-all ${explain ? 'bg-cyan-500' : 'bg-slate-700'}`}
                      onClick={() => setExplain(!explain)}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${explain ? 'left-5.5' : 'left-0.5'}`}
                        style={{ left: explain ? '22px' : '2px' }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Explainable AI</div>
                      <div className="text-xs text-slate-500">SHAP explanations</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5"
              style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" /> Info
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This is an AI-assisted screening tool. Predictions are based on pattern matching
                and trained ML models. Results do not guarantee complete security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

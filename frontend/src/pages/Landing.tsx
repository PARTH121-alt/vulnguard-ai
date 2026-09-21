import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileScan, ArrowRight, Brain, Lock, Eye, Zap, AlertTriangle, Code, Cpu } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered Detection', desc: 'Machine learning models trained to identify vulnerability patterns in source code.' },
  { icon: Eye, title: 'Explainable AI', desc: 'SHAP-based explanations showing why code was flagged as vulnerable.' },
  { icon: Zap, title: 'Multi-Language', desc: 'Support for Python, JavaScript, Java, and C++ source code analysis.' },
  { icon: Lock, title: 'CWE Classification', desc: 'Classifies vulnerabilities by CWE category with severity scoring.' },
  { icon: AlertTriangle, title: 'Risk Assessment', desc: 'Confidence scores and risk levels for each detected vulnerability.' },
  { icon: Cpu, title: 'Multiple Models', desc: 'Compare Random Forest, XGBoost, and CodeBERT predictions.' },
];

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-40 right-1/4 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,136,255,0.1) 0%, transparent 70%)' }} />
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
          ))}
        </div>

        <div className="max-w-6xl mx-auto text-center relative">
          <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-cyan-400">AI-Powered Security Analysis</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-white">Detect Vulnerabilities</span>
              <span className="block" style={{
                background: 'linear-gradient(135deg, #00d4ff, #0088ff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Before They Become Threats</span>
            </h1>

            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              VulnGuard AI uses machine learning to analyze source code for potential security weaknesses.
              Get instant vulnerability detection, classification, and explainable AI-powered insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/scanner"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
                <FileScan className="w-5 h-5" /> Analyze Code <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/docs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300"
                style={{ color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)', background: 'rgba(0, 212, 255, 0.05)' }}>
                View Documentation
              </Link>
            </div>
          </div>

          <div className={`mt-20 relative transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="rounded-2xl p-8 mx-auto max-w-4xl"
              style={{
                background: 'rgba(17, 22, 56, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 212, 255, 0.15)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-slate-500 font-mono">vulnguard_scanner.py</span>
              </div>
              <pre className="text-left text-sm font-mono leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-slate-500">{'# Vulnerable code example'}</span>{'\n'}
                  <span className="text-purple-400">import</span>{' '}<span className="text-yellow-300">os</span>{'\n'}
                  <span className="text-purple-400">import</span>{' '}<span className="text-yellow-300">sqlite3</span>{'\n\n'}
                  <span className="text-purple-400">def</span>{' '}<span className="text-blue-400">get_user</span><span className="text-slate-300">(user_id):</span>{'\n'}
                  {'    '}<span className="text-slate-300">conn = sqlite3.connect(</span><span className="text-green-400">'users.db'</span><span className="text-slate-300">)</span>{'\n'}
                  {'    '}<span className="text-slate-300">query = </span><span className="text-green-400">f"SELECT * FROM users WHERE id = </span><span className="text-red-400">{'{user_id}'}</span><span className="text-green-400">"</span>{'\n'}
                  {'    '}<span className="text-slate-300">result = conn.execute(</span><span className="text-red-400">query</span><span className="text-slate-300">) </span>
                  <span className="text-red-400">{'  # SQL Injection!'}</span>{'\n'}
                  {'    '}<span className="text-purple-400">return</span>{' '}<span className="text-slate-300">result.fetchone()</span>
                </code>
              </pre>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255, 71, 87, 0.15)' }}>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400 font-medium">SQL Injection Detected</span>
                </div>
                <span className="text-sm text-slate-500">Confidence: 88%</span>
                <span className="text-sm text-slate-500">Severity: Critical</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Security Features</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to identify and understand code vulnerabilities
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="rounded-xl p-6 transition-all duration-300 hover:scale-105 cursor-default"
                  style={{
                    background: 'rgba(17, 22, 56, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0, 212, 255, 0.1)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,136,255,0.2))' }}>
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: 'rgba(0, 212, 255, 0.03)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Code className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Secure Your Code?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Start analyzing your source code for vulnerabilities with AI-powered detection.
          </p>
          <Link to="/scanner"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
            <FileScan className="w-5 h-5" /> Start Free Analysis
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t" style={{ borderColor: 'rgba(0, 212, 255, 0.1)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold" style={{ color: '#00d4ff' }}>VulnGuard AI</span>
          </div>
          <p className="text-sm text-slate-500">
            AI-assisted screening tool. Does not guarantee complete software security.
          </p>
        </div>
      </footer>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle, Clock,
  ArrowLeft, Brain, FileCode, Info, ChevronRight, Copy, Download,
  Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import { analysisAPI } from '../services/api';

interface Finding {
  line: number;
  vulnerability_type: string;
  category?: string;
  cwe?: string;
  severity: string;
  confidence: number;
  explanation: string;
  code_snippet: string;
}

interface AnalysisResult {
  status: string;
  vulnerability_detected: boolean;
  vulnerability_type: string | null;
  severity: string | null;
  confidence: number;
  findings: Finding[];
  highlighted_lines: any[];
  explanation: any;
  feature_importance: any[];
  model_used: string;
  is_demo?: boolean;
  timestamp: string;
  id?: number;
}

interface Correction {
  line: number;
  vulnerability_type: string;
  category: string;
  fix_description: string;
  before: string;
  after: string;
  example_before: string;
  example_after: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff4757',
  high: '#ff6b35',
  medium: '#ffa502',
  low: '#2ed573',
};

const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(255, 71, 87, 0.15)',
  high: 'rgba(255, 107, 53, 0.15)',
  medium: 'rgba(255, 165, 2, 0.15)',
  low: 'rgba(46, 213, 115, 0.15)',
};

export default function AnalysisResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [fixedCode, setFixedCode] = useState('');
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [showFixedCode, setShowFixedCode] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResult');
    if (stored) {
      const parsed = JSON.parse(stored);
      setResult(parsed);
      if (parsed.vulnerability_detected && parsed.id) {
        fetchCorrections(parsed.id);
      }
    } else {
      navigate('/scanner');
    }
  }, [navigate]);

  const fetchCorrections = async (id: number) => {
    setLoadingCorrections(true);
    try {
      const res = await analysisAPI.getCorrections(id);
      setCorrections(res.data.corrections || []);
      setFixedCode(res.data.fixed_code || '');
    } catch (err) {
    } finally {
      setLoadingCorrections(false);
    }
  };

  if (!result) return null;

  const severity = result.severity || 'low';
  const confPct = Math.round(result.confidence * 100);
  const riskColor = SEVERITY_COLORS[severity] || '#2ed573';

  const featureChartData = result.feature_importance.slice(0, 8).map(f => ({
    name: f.feature.replace('dangerous_', '').replace(/_/g, ' ').substring(0, 20),
    value: Math.round(f.importance * 100),
    fill: f.direction === 'positive' ? '#ff4757' : '#00d4ff',
  }));

  const severityData = result.findings.reduce((acc: any, f) => {
    const existing = acc.find((a: any) => a.name === f.severity);
    if (existing) existing.value++;
    else acc.push({ name: f.severity, value: 1, fill: SEVERITY_COLORS[f.severity] || '#888' });
    return acc;
  }, []);

  const copyFindings = () => {
    const text = result.findings.map(f => `Line ${f.line}: ${f.vulnerability_type} (${f.severity}, ${Math.round(f.confidence * 100)}%)`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Findings copied!');
  };

  const exportReport = () => {
    const report = {
      report_title: 'VulnGuard AI Security Analysis Report',
      generated_at: result.timestamp,
      language: 'python',
      model_used: result.model_used,
      results: {
        status: result.vulnerability_detected ? 'VULNERABLE' : 'SAFE',
        vulnerability_type: result.vulnerability_type,
        severity: result.severity,
        confidence: `${Math.round(result.confidence * 100)}%`,
      },
      findings: result.findings,
      explanation: result.explanation,
      feature_importance: result.feature_importance,
      disclaimer: 'This is an AI-assisted screening result. Always perform thorough security auditing.',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulnguard-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/scanner')} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Analysis Results</h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {new Date(result.timestamp).toLocaleString()}
              {result.is_demo && (
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(255, 165, 2, 0.15)', color: '#ffa502' }}>
                  Demo Mode
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <div className="flex items-center gap-3 mb-4">
              {result.vulnerability_detected ?
                <ShieldAlert className="w-8 h-8 text-red-400" /> :
                <ShieldCheck className="w-8 h-8 text-green-400" />}
              <div>
                <div className="text-xs text-slate-400">Security Status</div>
                <div className={`text-lg font-bold ${result.vulnerability_detected ? 'text-red-400' : 'text-green-400'}`}>
                  {result.vulnerability_detected ? 'POTENTIALLY VULNERABLE' : 'SAFE'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" stroke="rgba(0,212,255,0.1)" strokeWidth="4" fill="none" />
                  <circle cx="32" cy="32" r="28" stroke={riskColor} strokeWidth="4" fill="none"
                    strokeDasharray={`${confPct * 1.76} 176`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: riskColor }}>
                  {confPct}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Confidence</div>
                <div className="text-lg font-bold text-white">Model Confidence</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6" style={{ color: riskColor }} />
              <div>
                <div className="text-xs text-slate-400">Risk Level</div>
                <div className="text-lg font-bold capitalize" style={{ color: riskColor }}>{severity}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-2">
              <Brain className="w-3.5 h-3.5" /> {result.model_used}
            </div>
          </div>
        </div>

        {result.vulnerability_detected && result.vulnerability_type && (
          <div className="rounded-xl p-6 mb-8"
            style={{ background: SEVERITY_BG[severity] || 'rgba(255,165,2,0.1)', border: `1px solid ${riskColor}33` }}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">Primary Vulnerability</div>
                <div className="text-xl font-bold text-white">{result.vulnerability_type}</div>
                {result.findings[0]?.cwe && (
                  <div className="text-sm text-slate-400 mt-1">CWE: {result.findings[0].cwe}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">Findings</div>
                <div className="text-2xl font-bold text-white">{result.findings.length}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="rounded-xl p-6"
              style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" /> Findings ({result.findings.length})
                </h3>
                <div className="flex items-center gap-2">
                  {result.findings.length > 0 && (
                    <button onClick={copyFindings} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  )}
                  <button onClick={exportReport} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
              {result.findings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No vulnerabilities detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.findings.map((f, i) => (
                    <div key={i} className="rounded-lg p-4" style={{ background: 'rgba(10, 14, 39, 0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: SEVERITY_BG[f.severity], color: SEVERITY_COLORS[f.severity] }}>
                            L{f.line}
                          </div>
                          <div>
                            <div className="font-medium text-white">{f.vulnerability_type}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span className="capitalize" style={{ color: SEVERITY_COLORS[f.severity] }}>{f.severity} Risk</span>
                              {f.cwe && <span>{f.cwe}</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-medium" style={{ color: riskColor }}>{Math.round(f.confidence * 100)}%</span>
                      </div>
                      {f.code_snippet && (
                        <div className="rounded-lg px-3 py-2 mb-2 text-sm font-mono text-red-300 overflow-x-auto"
                          style={{ background: 'rgba(255, 71, 87, 0.08)' }}>
                          {f.code_snippet}
                        </div>
                      )}
                      <p className="text-sm text-slate-400">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {featureChartData.length > 0 && (
              <div className="rounded-xl p-6"
                style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <h3 className="text-sm font-semibold text-white mb-4">Feature Importance</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={featureChartData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {featureChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {severityData.length > 0 && (
              <div className="rounded-xl p-6"
                style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <h3 className="text-sm font-semibold text-white mb-4">Severity Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {severityData.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {result.explanation && (
              <div className="rounded-xl p-6"
                style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" /> Why This Was Flagged
                </h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{result.explanation.summary}</p>
                {result.explanation.risk_factors?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {result.explanation.risk_factors.map((rf: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{rf.factor}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.explanation.recommendations?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-2 font-medium">Recommendations</div>
                    {result.explanation.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm mb-1.5">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-400">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {result.vulnerability_detected && corrections.length > 0 && (
              <div className="rounded-xl p-6 mt-6"
                style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" /> Suggested Fixes ({corrections.length})
                  </h3>
                  {fixedCode && (
                    <button onClick={() => setShowFixedCode(!showFixedCode)}
                      className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      {showFixedCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showFixedCode ? 'Hide' : 'Show'} Fixed Code
                    </button>
                  )}
                </div>

                {showFixedCode && fixedCode && (
                  <div className="mb-6 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2"
                      style={{ background: 'rgba(46, 213, 115, 0.1)', border: '1px solid rgba(46, 213, 115, 0.2)' }}>
                      <span className="text-xs font-medium text-green-400">Corrected Code</span>
                      <button onClick={() => { navigator.clipboard.writeText(fixedCode); toast.success('Fixed code copied!'); }}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="p-4 text-sm font-mono text-green-300 overflow-x-auto"
                      style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(46, 213, 115, 0.1)', borderTop: 'none', maxHeight: '400px' }}>
                      {fixedCode}
                    </pre>
                  </div>
                )}

                <div className="space-y-4">
                  {corrections.map((c, i) => (
                    <div key={i} className="rounded-lg overflow-hidden"
                      style={{ border: '1px solid rgba(255, 165, 2, 0.2)' }}>
                      <div className="px-4 py-3 flex items-center justify-between"
                        style={{ background: 'rgba(255, 165, 2, 0.08)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
                            style={{ background: 'rgba(255, 165, 2, 0.2)', color: '#ffa502' }}>
                            L{c.line}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{c.vulnerability_type}</div>
                            <div className="text-xs text-slate-500 capitalize">{c.category.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                        <div className="text-xs text-slate-400 font-medium">{c.fix_description}</div>
                        {c.before && (
                          <div>
                            <div className="text-xs text-red-400 mb-1 font-medium">Before (Vulnerable)</div>
                            <pre className="rounded-lg px-3 py-2 text-sm font-mono text-red-300 overflow-x-auto"
                              style={{ background: 'rgba(255, 71, 87, 0.08)' }}>
                              {c.before}
                            </pre>
                          </div>
                        )}
                        {c.after && (
                          <div>
                            <div className="text-xs text-green-400 mb-1 font-medium">After (Fixed)</div>
                            <pre className="rounded-lg px-3 py-2 text-sm font-mono text-green-300 overflow-x-auto"
                              style={{ background: 'rgba(46, 213, 115, 0.08)' }}>
                              {c.after}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl p-4 mb-8 flex items-start gap-3"
          style={{ background: 'rgba(255, 165, 2, 0.05)', border: '1px solid rgba(255, 165, 2, 0.15)' }}>
          <Info className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            This is an AI-assisted screening result. It identifies potential patterns but does not guarantee that the code is
            vulnerable or secure. Always perform thorough security auditing and penetration testing.
          </p>
        </div>
      </div>
    </div>
  );
}

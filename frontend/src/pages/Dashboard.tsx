import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Shield, FileScan, AlertTriangle, CheckCircle, Brain, TrendingUp, Activity, Code } from 'lucide-react';
import { analysisAPI } from '../services/api';

const StatCard = ({ icon: Icon, label, value, color, suffix }: any) => (
  <div className="rounded-xl p-5"
    style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
    <div className="text-2xl font-bold text-white">{value}{suffix || ''}</div>
  </div>
);

const COLORS = ['#ff4757', '#ff6b35', '#ffa502', '#00d4ff', '#2ed573', '#a55eea'];

export default function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analysisAPI.getHistory(0, 200)
      .then(res => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const totalScans = history.length;
  const vulnsDetected = history.filter(h => h.vulnerability_detected).length;
  const secureCount = totalScans - vulnsDetected;
  const highRisk = history.filter(h => h.severity === 'critical' || h.severity === 'high').length;
  const avgConfidence = totalScans > 0
    ? Math.round(history.reduce((sum, h) => sum + h.confidence, 0) / totalScans * 100)
    : 0;

  const categoryMap: Record<string, number> = {};
  const severityMap: Record<string, number> = {};
  const languageMap: Record<string, number> = {};
  history.forEach(h => {
    if (h.vulnerability_type) categoryMap[h.vulnerability_type] = (categoryMap[h.vulnerability_type] || 0) + 1;
    const sev = h.severity || 'safe';
    severityMap[sev] = (severityMap[sev] || 0) + 1;
    languageMap[h.language] = (languageMap[h.language] || 0) + 1;
  });

  const categoryData = Object.entries(categoryMap).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));
  const severityData = Object.entries(severityMap).map(([name, value], i) => {
    const sevColors: Record<string, string> = { critical: '#ff4757', high: '#ff6b35', medium: '#ffa502', low: '#2ed573', safe: '#2ed573' };
    return { name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: sevColors[name] || COLORS[i % COLORS.length] };
  });
  const languageData = Object.entries(languageMap).map(([name, value], i) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: COLORS[i % COLORS.length] }));

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8"><h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1></div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[1,2,3,4,5].map(i => <div key={i} className="rounded-xl h-28 animate-pulse" style={{ background: 'rgba(17, 22, 56, 0.7)' }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (totalScans === 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
            <p className="text-slate-400">Overview of vulnerability detection activity</p>
          </div>
          <div className="rounded-xl p-16 text-center" style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <FileScan className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Scans Yet</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Run your first code analysis to see security statistics and vulnerability trends here.
            </p>
            <Link to="/scanner"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
              <FileScan className="w-5 h-5" /> Start First Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
          <p className="text-slate-400">Overview of your vulnerability detection activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={FileScan} label="Total Scans" value={totalScans} color="#00d4ff" />
          <StatCard icon={AlertTriangle} label="Vulnerabilities" value={vulnsDetected} color="#ff4757" />
          <StatCard icon={CheckCircle} label="Secure" value={secureCount} color="#2ed573" />
          <StatCard icon={Shield} label="High Risk" value={highRisk} color="#ff6b35" />
          <StatCard icon={Brain} label="Avg Confidence" value={avgConfidence} color="#ffa502" suffix="%" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {categoryData.length > 0 && (
            <div className="rounded-xl p-6"
              style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" /> Vulnerability Categories
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {categoryData.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.fill }} />{c.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {severityData.length > 0 && (
            <div className="rounded-xl p-6"
              style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Severity Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {languageData.length > 0 && (
            <div className="rounded-xl p-6"
              style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" /> Language Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={languageData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {languageData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {languageData.map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.fill }} />{l.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Recent Scans
            </h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {history.slice(0, 10).map((h) => (
                <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: h.vulnerability_detected ? '#ff4757' : '#2ed573' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{h.vulnerability_type || 'No vulnerabilities'}</div>
                    <div className="text-xs text-slate-500">{h.language} | {Math.round(h.confidence * 100)}% | {new Date(h.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

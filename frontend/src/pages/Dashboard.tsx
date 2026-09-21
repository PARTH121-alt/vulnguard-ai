import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Shield, FileScan, AlertTriangle, CheckCircle, Brain, TrendingUp, Activity, Code } from 'lucide-react';
import CountUp from 'react-countup';
import { analysisAPI } from '../services/api';

const MOCK_STATS = {
  totalScans: 1247,
  vulnerabilitiesDetected: 389,
  secureSubmissions: 858,
  highRiskFindings: 67,
  avgConfidence: 84.2,
};

const MOCK_TIMELINE = [
  { date: 'Mon', scans: 45, vulns: 12 },
  { date: 'Tue', scans: 52, vulns: 18 },
  { date: 'Wed', scans: 38, vulns: 8 },
  { date: 'Thu', scans: 61, vulns: 22 },
  { date: 'Fri', scans: 55, vulns: 15 },
  { date: 'Sat', scans: 28, vulns: 6 },
  { date: 'Sun', scans: 32, vulns: 9 },
];

const MOCK_CATEGORIES = [
  { name: 'SQL Injection', value: 145, fill: '#ff4757' },
  { name: 'Command Injection', value: 89, fill: '#ff6b35' },
  { name: 'Hardcoded Credentials', value: 72, fill: '#ffa502' },
  { name: 'XSS', value: 56, fill: '#00d4ff' },
  { name: 'Path Traversal', value: 27, fill: '#2ed573' },
];

const MOCK_SEVERITY = [
  { name: 'Critical', value: 34, fill: '#ff4757' },
  { name: 'High', value: 89, fill: '#ff6b35' },
  { name: 'Medium', value: 156, fill: '#ffa502' },
  { name: 'Low', value: 110, fill: '#2ed573' },
];

const MOCK_LANGUAGES = [
  { name: 'Python', value: 520, fill: '#00d4ff' },
  { name: 'JavaScript', value: 380, fill: '#ffa502' },
  { name: 'Java', value: 210, fill: '#ff6b35' },
  { name: 'C++', value: 137, fill: '#2ed573' },
];

const StatCard = ({ icon: Icon, label, value, color, suffix }: any) => (
  <div className="rounded-xl p-5"
    style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
    <div className="text-2xl font-bold text-white">
      <CountUp end={value} duration={2} />{suffix || ''}
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
          <p className="text-slate-400">Overview of vulnerability detection activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={FileScan} label="Total Scans" value={MOCK_STATS.totalScans} color="#00d4ff" />
          <StatCard icon={AlertTriangle} label="Vulnerabilities" value={MOCK_STATS.vulnerabilitiesDetected} color="#ff4757" />
          <StatCard icon={CheckCircle} label="Secure" value={MOCK_STATS.secureSubmissions} color="#2ed573" />
          <StatCard icon={Shield} label="High Risk" value={MOCK_STATS.highRiskFindings} color="#ff6b35" />
          <StatCard icon={Brain} label="Avg Confidence" value={MOCK_STATS.avgConfidence} color="#ffa502" suffix="%" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Scans Over Time
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={MOCK_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="scans" fill="#00d4ff" radius={[4, 4, 0, 0]} name="Scans" />
                <Bar dataKey="vulns" fill="#ff4757" radius={[4, 4, 0, 0]} name="Vulnerabilities" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" /> Vulnerability Categories
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={MOCK_CATEGORIES} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {MOCK_CATEGORIES.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {MOCK_CATEGORIES.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.fill }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={MOCK_SEVERITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {MOCK_SEVERITY.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" /> Language Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={MOCK_LANGUAGES} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {MOCK_LANGUAGES.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {MOCK_LANGUAGES.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.fill }} />
                  {l.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

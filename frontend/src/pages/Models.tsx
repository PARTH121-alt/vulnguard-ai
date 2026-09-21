import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Brain, CheckCircle, XCircle, Info, Shield, Zap, Target } from 'lucide-react';

const MODELS = [
  {
    id: 'random_forest',
    name: 'Random Forest',
    description: 'Ensemble learning method that constructs multiple decision trees during training.',
    type: 'Traditional ML',
    available: true,
    metrics: { accuracy: 87, precision: 85, recall: 89, f1: 87, roc_auc: 92, fp: 23, fn: 18 },
    pros: ['Fast inference', 'Interpretable', 'Handles tabular features well'],
    cons: ['Misses code semantics', 'Feature engineering dependent'],
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    description: 'Gradient boosting framework optimized for performance and accuracy.',
    type: 'Traditional ML',
    available: true,
    metrics: { accuracy: 91, precision: 89, recall: 93, f1: 91, roc_auc: 95, fp: 15, fn: 12 },
    pros: ['Higher accuracy', 'Built-in regularization', 'Feature importance'],
    cons: ['Longer training', 'Less interpretable than RF'],
  },
  {
    id: 'codebert',
    name: 'CodeBERT',
    description: 'Pre-trained transformer model specifically designed for code understanding.',
    type: 'Transformer',
    available: false,
    metrics: { accuracy: 94, precision: 92, recall: 96, f1: 94, roc_auc: 97, fp: 8, fn: 5 },
    pros: ['Understands code semantics', 'Context-aware', 'Multi-language support'],
    cons: ['Requires fine-tuning', 'Higher compute cost', 'Demo metrics shown'],
    note: 'Demo integration - requires fine-tuning on vulnerability dataset for production use',
  },
  {
    id: 'ensemble',
    name: 'Ensemble',
    description: 'Combines predictions from multiple models for more robust detection.',
    type: 'Ensemble',
    available: true,
    metrics: { accuracy: 93, precision: 91, recall: 95, f1: 93, roc_auc: 96, fp: 11, fn: 8 },
    pros: ['Best overall performance', 'Reduces individual model weaknesses', 'More reliable'],
    cons: ['Higher latency', 'Complex to deploy'],
  },
];

const METRIC_LABELS: Record<string, string> = {
  accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1: 'F1 Score', roc_auc: 'ROC-AUC',
};

export default function Models() {
  const [selected, setSelected] = useState('random_forest');
  const model = MODELS.find(m => m.id === selected)!;

  const radarData = MODELS.map(m => ({
    model: m.name.split(' ').slice(0, 2).join(' '),
    Accuracy: m.metrics.accuracy,
    Precision: m.metrics.precision,
    Recall: m.metrics.recall,
    'F1 Score': m.metrics.f1,
    'ROC-AUC': m.metrics.roc_auc,
  }));

  const barData = Object.entries(model.metrics)
    .filter(([k]) => ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'].includes(k))
    .map(([k, v]) => ({ name: METRIC_LABELS[k], value: v, fill: k === 'recall' ? '#ffa502' : '#00d4ff' }));

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Model Comparison</h1>
          <p className="text-slate-400">Compare different ML models for vulnerability detection</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {MODELS.map(m => (
            <div key={m.id} onClick={() => setSelected(m.id)}
              className={`rounded-xl p-5 cursor-pointer transition-all duration-300 ${selected === m.id ? 'ring-2' : ''}`}
              style={{
                background: 'rgba(17, 22, 56, 0.7)',
                border: `1px solid ${selected === m.id ? 'rgba(0, 212, 255, 0.5)' : 'rgba(0, 212, 255, 0.1)'}`,
                ...(selected === m.id ? { boxShadow: '0 0 30px rgba(0, 212, 255, 0.15)' } : {}),
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">{m.name}</h3>
                </div>
                {m.available ?
                  <CheckCircle className="w-4 h-4 text-green-400" /> :
                  <XCircle className="w-4 h-4 text-yellow-400" />}
              </div>
              <p className="text-xs text-slate-400 mb-3">{m.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>{m.type}</span>
                {!m.available && <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,165,2,0.1)', color: '#ffa502' }}>Demo</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['accuracy', 'recall', 'f1'].map(k => (
                  <div key={k} className="text-center">
                    <div className="text-lg font-bold text-white">{m.metrics[k as keyof typeof m.metrics]}%</div>
                    <div className="text-xs text-slate-500 capitalize">{k === 'f1' ? 'F1' : k}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-sm font-semibold text-white mb-4">{model.name} - Metrics</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <rect key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-sm font-semibold text-white mb-4">Model Comparison - Radar</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="model" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Accuracy" dataKey="Accuracy" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.1} />
                <Radar name="Recall" dataKey="Recall" stroke="#ffa502" fill="#ffa502" fillOpacity={0.1} />
                <Tooltip contentStyle={{ background: '#111638', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-6 mb-8"
          style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
          <h3 className="text-lg font-semibold text-white mb-4">{model.name} - Details</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Strengths
              </h4>
              <ul className="space-y-1.5">
                {model.pros.map((p, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Limitations
              </h4>
              <ul className="space-y-1.5">
                {model.cons.map((c, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-cyan-400 mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> False Positives / Negatives
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,71,87,0.1)' }}>
                  <div className="text-2xl font-bold text-red-400">{model.metrics.fp}</div>
                  <div className="text-xs text-slate-500">False Positives</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,165,2,0.1)' }}>
                  <div className="text-2xl font-bold text-yellow-400">{model.metrics.fn}</div>
                  <div className="text-xs text-slate-500">False Negatives</div>
                </div>
              </div>
            </div>
          </div>
          {model.note && (
            <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(255,165,2,0.05)', border: '1px solid rgba(255,165,2,0.15)' }}>
              <Info className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-400">{model.note}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
          <Shield className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            <strong className="text-white">Why Recall Matters:</strong> In vulnerability detection, recall (true positive rate)
            is particularly important because missed vulnerabilities (false negatives) can have significant security consequences.
            A model with higher recall catches more actual vulnerabilities, even at the cost of some false alarms.
          </p>
        </div>
      </div>
    </div>
  );
}

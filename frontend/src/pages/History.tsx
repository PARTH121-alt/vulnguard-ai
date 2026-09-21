import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Eye, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { analysisAPI } from '../services/api';
import { toast } from 'react-toastify';

interface HistoryItem {
  id: number;
  language: string;
  vulnerability_detected: boolean;
  vulnerability_type: string | null;
  severity: string | null;
  confidence: number;
  model_used: string;
  timestamp: string;
}

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await analysisAPI.getHistory();
      setItems(res.data);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await analysisAPI.deleteAnalysis(id);
      setItems(items.filter(i => i.id !== id));
      setDeleteConfirm(null);
      toast.success('Analysis deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleView = async (id: number) => {
    try {
      const res = await analysisAPI.getAnalysis(id);
      sessionStorage.setItem('analysisResult', JSON.stringify(res.data));
      navigate('/results');
    } catch (err) {
      toast.error('Failed to load analysis');
    }
  };

  const filtered = items
    .filter(i => {
      if (search && !i.vulnerability_type?.toLowerCase().includes(search.toLowerCase()) && !i.language.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLang !== 'all' && i.language !== filterLang) return false;
      if (filterStatus === 'vulnerable' && !i.vulnerability_detected) return false;
      if (filterStatus === 'safe' && i.vulnerability_detected) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'timestamp') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return 0;
    });

  const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ff4757', high: '#ff6b35', medium: '#ffa502', low: '#2ed573',
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analysis History</h1>
          <p className="text-slate-400">View and manage your previous code analyses</p>
        </div>

        <div className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search by type or language..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
            </div>
            <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
              <option value="all">All Status</option>
              <option value="vulnerable">Vulnerable</option>
              <option value="safe">Safe</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
              <option value="timestamp">Newest First</option>
              <option value="confidence">Highest Confidence</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: 'rgba(17, 22, 56, 0.7)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl p-12 text-center"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No analysis history yet</p>
            <p className="text-slate-500 text-sm">Run your first code analysis to see results here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="rounded-xl p-4 flex items-center gap-4 transition-all hover:border-cyan-500/30"
                style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: item.vulnerability_detected ? 'rgba(255,71,87,0.15)' : 'rgba(46,213,115,0.15)' }}>
                  {item.vulnerability_detected ?
                    <AlertTriangle className="w-5 h-5 text-red-400" /> :
                    <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      {item.vulnerability_type || 'No vulnerabilities'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs capitalize"
                      style={{
                        background: `${SEVERITY_COLORS[item.severity || 'low']}20`,
                        color: SEVERITY_COLORS[item.severity || 'low'],
                      }}>
                      {item.severity || 'safe'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="capitalize">{item.language}</span>
                    <span>{Math.round(item.confidence * 100)}%</span>
                    <span>{item.model_used}</span>
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleView(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                    <Eye className="w-4 h-4" />
                  </button>
                  {deleteConfirm === item.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 rounded text-xs font-medium text-white bg-red-500 hover:bg-red-600">Delete</button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 rounded text-xs font-medium text-slate-400 hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

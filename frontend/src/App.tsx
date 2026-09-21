import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CodeScanner from './pages/CodeScanner';
import AnalysisResults from './pages/AnalysisResults';
import History from './pages/History';
import Models from './pages/Models';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e27' }}>
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><Layout><CodeScanner /></Layout></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Layout><AnalysisResults /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
      <Route path="/models" element={<ProtectedRoute><Layout><Models /></Layout></ProtectedRoute>} />
      <Route path="/docs" element={<ProtectedRoute><Layout><Documentation /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{
            background: 'rgba(17, 22, 56, 0.95)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            backdropFilter: 'blur(12px)',
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;

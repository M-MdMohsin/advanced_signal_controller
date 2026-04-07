import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        onLogin(data.user);
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary, #0f172a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── Background decorations ── */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '700px', height: '700px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(59,130,246,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '400px',
        padding: '40px 30px',
        background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(59,130,246,0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: '14px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          marginBottom: '20px'
        }}>🚦</div>
        
        <h2 style={{
          margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center'
        }}>ATMS Sign In</h2>
        <p style={{
          margin: '0 0 24px 0', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center'
        }}>Enter your credentials to continue</p>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              autoComplete="username"
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#f8fafc', fontSize: '0.9rem',
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{
                width: '100%', padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#f8fafc', fontSize: '0.9rem',
                outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: '0.8rem', textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px', marginTop: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              transition: 'all 0.2s ease', opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.6)';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)';
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

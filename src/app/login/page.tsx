'use client';

import { useState } from 'react';
import { setToken, clearToken, getToken } from '@/lib/token';

export default function LoginPage() {
  const [username, setU] = useState('owner');
  const [password, setP] = useState('owner123');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Login failed');
      }

      // store JWT from backend
      setToken(json.token);
      setMsg('✅ Logged in successfully. Token saved.');
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    clearToken();
    setMsg('Logged out (token cleared).');
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Login</h1>

      {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}

      <form onSubmit={onLogin} style={{ display: 'grid', gap: 8 }}>
        <input
          value={username}
          onChange={(e) => setU(e.target.value)}
          placeholder="username"
          style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4 }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setP(e.target.value)}
          placeholder="password"
          style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: 10, borderRadius: 4, background: 'black', color: 'white' }}
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={onLogout}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        Current token: <code>{getToken() || '(none)'}</code>
      </div>
    </div>
  );
}
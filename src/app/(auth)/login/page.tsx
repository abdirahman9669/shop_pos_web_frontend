'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

type LoginResp = {
  ok: boolean;
  token: string;
  user: { id: string; username: string; role: string; shop_id: string };
  shop: { id: string; name: string; slug: string };
};

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [username, setU] = useState('owner');
  const [password, setP] = useState('owner123');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as LoginResp;

      if (!res.ok || !json.ok) throw new Error((json as any).error || 'Login failed');

      // ✅ save token directly into localStorage
      localStorage.setItem('token', json.token);
      localStorage.setItem('shop_id', json.user.shop_id);
      localStorage.setItem('user_id', json.user.id);
 
      setMsg('✅ Logged in successfully!');

      // ✅ redirect to ?next=... or home
      const next = sp.get('next') || '/';
      router.replace(next);
    } catch (err: any) {
      setMsg(`❌ ${err.message || 'Login failed'}`);
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    localStorage.removeItem('token');
    setMsg('Logged out (token cleared).');
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', fontFamily: 'system-ui' }}>
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

      <div style={{ marginTop: 12, fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
        Current token: <code>{localStorage.getItem('token') || '(none)'}</code>
      </div>
    </div>
  );
}
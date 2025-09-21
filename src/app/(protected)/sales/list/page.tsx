'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/token';
import { fmtMoneyUSD, fmtDateTime } from '@/lib/format';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

type SaleRow = {
  id: string;
  total_usd: number;
  total_native_amount?: number;
  native_currency?: string;
  createdAt?: string;
};

export default function SalesPage() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  async function load() {
    try {
      setLoading(true);
      setErr('');
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/sales`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      setRows(Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load sales');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Sales (latest)</h1>
        <button onClick={load} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
          Refresh
        </button>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color: '#b00' }}>{err}</div>}

      {!loading && !err && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: 8 }}>ID</th>
                <th style={{ padding: 8 }}>Total (USD)</th>
                <th style={{ padding: 8 }}>Native</th>
                <th style={{ padding: 8 }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 12, color: '#666' }}>No sales found.</td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                    <td style={{ padding: 8, fontFamily: 'ui-monospace, monospace' }}>{r.id}</td>
                    <td style={{ padding: 8 }}>{fmtMoneyUSD(Number(r.total_usd || 0))}</td>
                    <td style={{ padding: 8 }}>
                      {r.native_currency ? `${r.total_native_amount ?? 0} ${r.native_currency}` : '—'}
                    </td>
                    <td style={{ padding: 8 }}>{r.createdAt ? fmtDateTime(r.createdAt) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
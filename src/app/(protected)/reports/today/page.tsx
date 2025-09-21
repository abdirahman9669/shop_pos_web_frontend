'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/token';
import { fmtMoneyUSD, fmtSOSasUSD } from '@/lib/format';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

type TodayApi = {
  ok: boolean;
  date_utc: string;
  sales: {
    count: number;
    usd_sales_usd: number;
    sos_sales_usd_equiv: number;
    total_usd: number;
  };
  cogs_usd: number;
  gross_margin_usd: number;
  cash: {
    USD: number;
    SOS_usd_equiv: number;
  };
};

export default function TodayPage() {
  const [data, setData] = useState<TodayApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  async function load() {
    try {
      setLoading(true);
      setErr('');
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/reports/today`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed to load');
      setData(json as TodayApi);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Today</h1>
        <button onClick={load} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
          Refresh
        </button>
        {data?.date_utc && <span style={{ color: '#666' }}>UTC date: {data.date_utc}</span>}
      </div>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color: '#b00' }}>{err}</div>}

      {data && !loading && !err && (
        <>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Card title="Sales (count)">{data.sales.count}</Card>
            <Card title="Sales USD (cash + AR)">{fmtMoneyUSD(data.sales.usd_sales_usd)}</Card>
            <Card title="Sales SOS (USD equiv)">{fmtMoneyUSD(data.sales.sos_sales_usd_equiv)}</Card>
            <Card title="Total Sales (USD)">{fmtMoneyUSD(data.sales.total_usd)}</Card>
            <Card title="COGS (USD)">{fmtMoneyUSD(data.cogs_usd)}</Card>
            <Card title="Gross Margin (USD)">{fmtMoneyUSD(data.gross_margin_usd)}</Card>
          </div>

          <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 600 }}>Cash on hand</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Card title="USD drawer">{fmtMoneyUSD(data.cash.USD)}</Card>
            <Card title="SOS drawer (USD equiv)">{fmtSOSasUSD(data.cash.SOS_usd_equiv)}</Card>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid #eee',
      borderRadius: 8,
      padding: 12,
      background: '#fff'
    }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{children}</div>
    </div>
  );
}
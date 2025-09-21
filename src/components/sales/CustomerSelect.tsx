'use client';

import { useEffect, useMemo, useState } from 'react';
import { getToken } from '@/lib/session';
import { apiGet } from '@/lib/api-client';

type Customer = { id: string; name: string; phone?: string | null };

type Props = {
  value: string | null;
  onChange: (id: string | null, customer?: Customer | null) => void;
};

export default function CustomerSelect({ value, onChange }: Props) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Customer[]>([]);
  const token = getToken() || undefined;

  // simple debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await apiGet<{ ok: boolean; data: Customer[]; total: number }>(
          `/api/customers?q=${encodeURIComponent(q)}`, token
        );
        setRows(resp.data || []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, token]);

  const selected = useMemo(() => rows.find(r => r.id === value) || null, [rows, value]);

  return (
    <div style={{ display:'grid', gap: 6 }}>
      <label style={{ fontSize: 12, color: '#555' }}>Customer</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name/phone…"
        style={{ border:'1px solid #ddd', padding: 8, borderRadius: 6 }}
      />
      {loading && <div style={{ fontSize: 12, color:'#999' }}>Searching…</div>}
      <div style={{ border:'1px solid #eee', borderRadius: 6, maxHeight: 160, overflow:'auto' }}>
        {rows.map(c => (
          <div
            key={c.id}
            onClick={() => onChange(c.id, c)}
            style={{
              padding: 8,
              cursor: 'pointer',
              background: c.id === value ? '#f0f7ff' : 'transparent',
              borderBottom: '1px solid #f4f4f4'
            }}
          >
            <div style={{ fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 12, color:'#666' }}>{c.phone || ''}</div>
          </div>
        ))}
        {!loading && rows.length === 0 && <div style={{ padding: 8, fontSize: 12, color:'#888' }}>No results</div>}
      </div>
      {selected && (
        <div style={{ fontSize: 12, color:'#333' }}>
          Selected: <strong>{selected.name}</strong>
        </div>
      )}
    </div>
  );
}
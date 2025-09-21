'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/session';
import { apiGet } from '@/lib/api-client';

type Product = {
  id: string;
  sku: string;
  name: string;
};

type Line = { product_id: string; qty: number; unit_price_usd: number };

type Props = {
  value: Line[];
  onChange: (lines: Line[]) => void;
};

export default function ProductPicker({ value, onChange }: Props) {
  const token = getToken() || undefined;
  const [prods, setProds] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await apiGet<{ ok: boolean; data: any[]; total: number }>(
          '/api/products?limit=100', token
        );
        setProds((resp.data || []).map((p: any) => ({
          id: p.id, sku: p.sku, name: p.name,
        })));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  function addLine(pid: string) {
    if (value.find(l => l.product_id === pid)) return;
    const p = prods.find(p => p.id === pid);
    if (!p) return;
    onChange([...value, { product_id: pid, qty: 1, unit_price_usd: 0 }]);
  }

  function updateLine(i: number, patch: Partial<Line>) {
    const copy = [...value];
    copy[i] = { ...copy[i], ...patch };
    onChange(copy);
  }

  function removeLine(i: number) {
    const copy = [...value];
    copy.splice(i, 1);
    onChange(copy);
  }

  return (
    <div style={{ display:'grid', gap: 8 }}>
      <label style={{ fontSize: 12, color: '#555' }}>Products</label>

      {loading ? (
        <div>Loading products…</div>
      ) : (
        <select onChange={(e) => e.target.value && addLine(e.target.value)}>
          <option value="">+ Add a product…</option>
          {prods.map(p => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
      )}

      <div style={{ border:'1px solid #eee', borderRadius: 6 }}>
        {value.length === 0 && (
          <div style={{ padding: 10, color: '#777', fontSize: 13 }}>
            No lines yet. Pick a product above.
          </div>
        )}
        {value.map((l, i) => {
          const p = prods.find(x => x.id === l.product_id);
          return (
            <div key={l.product_id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 120px 80px', gap: 8, padding: 8, borderTop:'1px solid #f4f4f4', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p?.name || l.product_id}</div>
                <div style={{ fontSize: 12, color:'#888' }}>{p?.sku}</div>
              </div>
              <input
                type="number"
                min={0}
                step="1"
                value={l.qty}
                onChange={(e) => updateLine(i, { qty: Number(e.target.value || 0) })}
                style={{ border:'1px solid #ddd', padding: 6, borderRadius: 6 }}
                placeholder="Qty"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={l.unit_price_usd}
                onChange={(e) => updateLine(i, { unit_price_usd: Number(e.target.value || 0) })}
                style={{ border:'1px solid #ddd', padding: 6, borderRadius: 6 }}
                placeholder="Unit price (USD)"
              />
              <button onClick={() => removeLine(i)} style={{ border:'1px solid #ddd', borderRadius: 6, padding: 6 }}>
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { getToken } from '@/lib/token';

type Product = {
  id: string;
  sku: string;
  name: string;
  price_usd?: number | null;
};

type Line = { product_id: string; qty: number; unit_price_usd: number };

type Props = {
  value: Line[];
  onChange: (lines: Line[]) => void;
  placeholder?: string;
  minChars?: number; // default 2
};

export default function ProductPicker({
  value,
  onChange,
  placeholder = 'Search product (name or SKU)…',
  minChars = 2,
}: Props) {
  const token = getToken() || undefined;

  // search state
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  // local catalog cache used to render picked lines (name/sku/price)
  const [catalog, setCatalog] = useState<Record<string, Product>>({});

  const boxRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<any>(null);

  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // debounced search
  useEffect(() => {
    if (!open) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const q = query.trim();
      if (q.length < minChars) {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        // backend should support ?q= filtering (by name/SKU)
        const resp = await apiGet<{ ok: boolean; data: any[]; total: number }>(
          `/api/products?q=${encodeURIComponent(q)}&limit=20`,
          token
        );
        const items: Product[] = (resp.data || []).map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          price_usd: p.price_usd != null ? Number(p.price_usd) : null,
        }));
        setResults(items);

        // merge into local catalog for line rendering
        setCatalog((prev) => {
          const next = { ...prev };
          for (const p of items) next[p.id] = p;
          return next;
        });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => timerRef.current && clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open, token, minChars]);

  function addOrBump(pid: string) {
    const existingIdx = value.findIndex((l) => l.product_id === pid);
    const p = catalog[pid] || results.find((r) => r.id === pid);
    const unitPrice = Number(p?.price_usd ?? 0);

    if (existingIdx >= 0) {
      // bump qty by 1
      const copy = [...value];
      copy[existingIdx] = {
        ...copy[existingIdx],
        qty: Number(copy[existingIdx].qty || 0) + 1,
        // keep existing unit_price_usd as the user may have edited it
      };
      onChange(copy);
    } else {
      onChange([
        ...value,
        { product_id: pid, qty: 1, unit_price_usd: unitPrice },
      ]);
    }
  }

  function select(p: Product) {
    addOrBump(p.id);
    // keep search open for more; clear input & show suggestions again
    setQuery('');
    setResults([]);
    setOpen(true);
    // ensure product is in catalog (for lines render)
    setCatalog((prev) => ({ ...prev, [p.id]: p }));
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

  const enrichedLines = useMemo(() => {
    return value.map((l) => ({
      ...l,
      product: catalog[l.product_id],
    }));
  }, [value, catalog]);

  return (
    <div style={{ display: 'grid', gap: 8 }} ref={boxRef}>
      <label style={{ fontSize: 12, color: '#555' }}>Products</label>

      {/* search box always visible */}
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid #ddd', padding: 8, borderRadius: 8 }}
      />

      {/* dropdown */}
      {open && (
        <div
          style={{
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              zIndex: 20,
              top: 6,
              left: 0,
              right: 0,
              border: '1px solid #eee',
              borderRadius: 8,
              background: 'white',
              boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {loading ? (
                <div style={{ padding: 10, color: '#666' }}>Searching…</div>
                ) : results.length === 0 ? (
                <div style={{ padding: 10, color: '#999' }}>No matches</div>
                ) : (
                results.map((p) => (
                    <button
                    key={p.id}
                    onClick={() => select(p)}
                    style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: 'none',
                        borderBottom: '1px solid #f5f5f5',
                        background: 'white',
                        cursor: 'pointer',
                    }}
                    >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{p.sku}</div>
                        {p.price_usd != null && (
                        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#444' }}>
                            ${Number(p.price_usd).toFixed(2)}
                        </div>
                        )}
                    </div>
                    </button>
                ))
                )}
          </div>
        </div>
      )}

      {/* current lines */}
      <div style={{ border: '1px solid #eee', borderRadius: 6, marginTop: open ? 60 : 0 }}>
        {value.length === 0 ? (
          <div style={{ padding: 10, color: '#777', fontSize: 13 }}>
            No lines yet. Search above and click a product to add.
          </div>
        ) : (
          enrichedLines.map((l, i) => (
            <div
              key={`${l.product_id}-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 140px 90px',
                gap: 8,
                padding: 8,
                borderTop: '1px solid #f4f4f4',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{l.product?.name || l.product_id}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{l.product?.sku}</div>
              </div>

              <input
                type="number"
                min={0}
                step="1"
                value={l.qty}
                onChange={(e) => updateLine(i, { qty: Number(e.target.value || 0) })}
                style={{ border: '1px solid #ddd', padding: 6, borderRadius: 6 }}
                placeholder="Qty"
              />

              <input
                type="number"
                min={0}
                step="0.01"
                value={l.unit_price_usd}
                onChange={(e) => updateLine(i, { unit_price_usd: Number(e.target.value || 0) })}
                style={{ border: '1px solid #ddd', padding: 6, borderRadius: 6 }}
                placeholder="Unit price (USD)"
              />

              <button
                onClick={() => removeLine(i)}
                style={{ border: '1px solid #ddd', borderRadius: 6, padding: 6 }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
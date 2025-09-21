'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { getToken } from '@/lib/token';

type Customer = { id: string; name: string; phone?: string | null };

type Props = {
  value: Customer | null;                 // selected
  onChange: (c: Customer | null) => void; // notify parent
  placeholder?: string;
};

export default function CustomerSelect({ value, onChange, placeholder = 'Search customer...' }: Props) {
  const token = getToken() || undefined;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  const boxRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<any>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search (min 2 chars)
  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setErr('');
        return;
      }
      try {
        setLoading(true);
        setErr('');
        const resp = await apiGet<{ ok: boolean; data: any[]; total: number }>(
          `/api/customers?q=${encodeURIComponent(q)}&limit=10`,
          token
        );
        const items: Customer[] = (resp.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone ?? '',
        }));
        setResults(items);
      } catch (e: any) {
        setErr(e?.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [query, open, token]);

  function select(c: Customer) {
    onChange(c);
    setOpen(false);
    setQuery(''); // reset input text
    setResults([]);
  }

  function clear() {
    onChange(null);
  }

  return (
    <div ref={boxRef} style={{ position: 'relative', display: 'grid', gap: 8 }}>
      {/* Always-visible search input */}
      <div>
        <label style={{ fontSize: 12, color: '#555' }}>Customer</label>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{ width: '100%', border: '1px solid #ddd', padding: 8, borderRadius: 8 }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '68px',
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
          ) : err ? (
            <div style={{ padding: 10, color: '#b00' }}>{err}</div>
          ) : query.trim().length < 2 ? (
            <div style={{ padding: 10, color: '#999' }}>Type at least 2 characters…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 10, color: '#999' }}>No matches</div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => select(c)}
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
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                {c.phone ? <div style={{ fontSize: 12, color: '#666' }}>{c.phone}</div> : null}
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected pill BELOW the input */}
      {value && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fafafa',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{value.name}</div>
            {value.phone ? <div style={{ fontSize: 12, color: '#666' }}>{value.phone}</div> : null}
          </div>
          <button
            onClick={clear}
            title="Clear"
            style={{
              marginLeft: 'auto',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
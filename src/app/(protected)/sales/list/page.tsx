'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export default function SalesList() {
  const [rows, setRows] = useState<any[]>([]); // ✅ start with []

  useEffect(() => {
    async function fetchSales() {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/sales`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        // If backend wraps in { ok, data }, unwrap it
        setRows(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error('Failed to load sales:', err);
        setRows([]); // fallback
      }
    }
    fetchSales();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Sales (latest)</h2>
      <ul className="list-disc pl-5">
        {rows.length > 0 ? (
          rows.map((r) => (
            <li key={r.id}>
              {r.id} • {r.total_usd}
            </li>
          ))
        ) : (
          <li>No sales found.</li>
        )}
      </ul>
    </div>
  );
}
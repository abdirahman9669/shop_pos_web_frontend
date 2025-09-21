// src/lib/api.ts
const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export async function apiGet<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
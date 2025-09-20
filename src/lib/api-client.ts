'use client';

import { getToken } from '@/lib/token';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();

  // Build headers explicitly to avoid TS issues with undefined values
  const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...baseHeaders, ...(init.headers as Record<string, string> || {}) },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
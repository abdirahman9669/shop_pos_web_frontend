// 'use client' because localStorage is browser-only
'use client';

const KEY = 'pos_token';

export function setToken(token: string) {
  try { localStorage.setItem(KEY, token); } catch {}
}

export function getToken(): string | null {
  try { return localStorage.getItem(KEY); } catch {}
  return null;
}

export function clearToken() {
  try { localStorage.removeItem(KEY); } catch {}
}
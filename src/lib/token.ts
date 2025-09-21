// src/lib/token.ts
export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  window.dispatchEvent(new Event('auth:changed'));   // 🔔 notify listeners
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth:changed'));   // 🔔 notify listeners
}
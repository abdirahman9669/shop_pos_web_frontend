// simple client-only helpers for localStorage
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getShopId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('shop_id');
}
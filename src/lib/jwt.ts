// src/lib/jwt.ts
import { getToken } from '@/lib/token';

type JwtPayload = { shop_id?: string; [k: string]: any };

export function getShopIdFromJWT(): string | null {
  try {
    const t = getToken();
    if (!t) return null;
    const [, payload] = t.split('.');
    const json = JSON.parse(atob(payload));
    return (json as JwtPayload).shop_id ?? null;
  } catch {
    return null;
  }
}
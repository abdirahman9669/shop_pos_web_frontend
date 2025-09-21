// src/lib/format.ts
export function fmtMoneyUSD(n: number) {
  if (!isFinite(n)) return '-';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function fmtSOSasUSD(n: number) {
  // shows SOS USD-equivalent as USD (your API already converts)
  if (!isFinite(n)) return '-';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
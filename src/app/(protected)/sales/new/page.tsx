'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/token'; // ← make sure this path is correct
import { apiGet, apiPost } from '@/lib/api-client';
import CustomerPicker from '@/components/sales/CustomerSelect'; // your component exports default
import ProductPicker from '@/components/sales/ProductPicker';

type Device = { id: string; label: string };
type CashSession = { id: string; device_id: string; opened_at: string; closed_at: string | null };
type Store = { id: string; name: string; type: string };
type Currency = { code: 'USD'|'SOS'; name: string };
type Account = { id: string; name: string; AccountType?: { name: string } };

type Customer = { id: string; name: string; phone?: string | null };
type Line = { product_id: string; qty: number; unit_price_usd: number };

// If you stored shop_id somewhere else, adapt this:
function getShopIdFromJWT(token: string | null): string {
  try {
    if (!token) return '';
    const [, payload] = token.split('.');
    const json = JSON.parse(atob(payload));
    return json?.shop_id || '';
  } catch { return ''; }
}

export default function NewSalePage() {
  const router = useRouter();
  const token = getToken() || null;
  const shop_id = getShopIdFromJWT(token);

  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currs, setCurrs] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [deviceId, setDeviceId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [customer, setCustomer] = useState<Customer | null>(null); // ← object, not id

  const [lines, setLines] = useState<Line[]>([]);

  const [currency, setCurrency] = useState<'USD'|'SOS'>('USD');
  const [methodAccountId, setMethodAccountId] = useState<string>('');
  const [amountPaidUsd, setAmountPaidUsd] = useState<number>(0);
  const [sosRate, setSosRate] = useState<number>(27000);

  const [msg, setMsg] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // fetch dropdown data
  useEffect(() => {
    (async () => {
      try {
        const [dev, ses, st, cur, acc] = await Promise.all([
          apiGet<{ ok: boolean; data: any[]; total: number }>('/api/devices', token || undefined),
          apiGet<any[]>('/api/cash-sessions', token || undefined),
          apiGet<any[]>('/api/stores', token || undefined),
          apiGet<{ ok: boolean; currencies: Currency[] }>('/api/currencies', token || undefined),
          apiGet<{ ok: boolean; data: Account[]; total: number }>('/api/accounts?limit=200', token || undefined),
        ]);

        setDevices((dev.data || []).map(d => ({ id: d.id, label: d.label })));
        setSessions(ses || []);
        setStores(st || []);
        setCurrs(cur.currencies || []);
        setAccounts(acc.data || []);

        if (!deviceId && dev.data?.[0]) setDeviceId(dev.data[0].id);
        if (!storeId && st?.[0]) setStoreId(st[0].id);

        const firstDevice = dev.data?.[0]?.id || '';
        const openForDevice = (ses || []).find((s: CashSession) => s.device_id === firstDevice && !s.closed_at);
        if (!sessionId && openForDevice) setSessionId(openForDevice.id);

        const defaultCash =
          (acc.data || []).find(a =>
            a.AccountType?.name === 'CASH_ON_HAND' &&
            ((currency === 'USD' && /USD/i.test(a.name)) || (currency === 'SOS' && /SOS/i.test(a.name)))
          ) || (acc.data || []).find(a => a.AccountType?.name === 'CASH_ON_HAND');
        if (defaultCash && !methodAccountId) setMethodAccountId(defaultCash.id);
      } catch (e: any) {
        setMsg(`Failed to load dropdowns: ${e.message || e}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-pick default cash account when currency changes
  useEffect(() => {
    const pick =
      accounts.find(a =>
        a.AccountType?.name === 'CASH_ON_HAND' &&
        ((currency === 'USD' && /USD/i.test(a.name)) || (currency === 'SOS' && /SOS/i.test(a.name)))
      ) || accounts.find(a => a.AccountType?.name === 'CASH_ON_HAND');
    if (pick) setMethodAccountId(pick.id);
  }, [currency, accounts]);

  const totalUsd = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unit_price_usd)), 0),
    [lines]
  );

  async function submit() {
    setMsg('');
    if (!shop_id) return setMsg('No shop_id (not found in token).');
    if (!deviceId || !sessionId || !storeId) return setMsg('Select device, cash session, and store.');
    if (!customer) return setMsg('Pick a customer.');
    if (lines.length === 0) return setMsg('Add at least one product line.');

    setBusy(true);
    try {
      const acct = accounts.find(a => a.id === methodAccountId);
      const method =
        /USD/i.test(acct?.name || '') ? 'CASH_USD'
        : /SOS/i.test(acct?.name || '') ? 'CASH_SOS'
        : 'CASH_USD';

      const body = {
        shop_id,
        device_id: deviceId,
        cash_session_id: sessionId,
        store_id: storeId,
        customer_id: customer.id, // ← from selected object
        lines: lines.map(l => ({
          product_id: l.product_id,
          qty: Number(l.qty),
          unit_price_usd: Number(l.unit_price_usd),
        })),
        pay: {
          method,
          currency,
          amount_usd: Number(amountPaidUsd || 0),
          ...(currency === 'SOS' ? { customer_rate_used: Number(sosRate) } : {}),
        },
        status: 'COMPLETED',
      };

      const resp = await apiPost<any>('/api/sales', body, token || undefined);
      setMsg(`✅ Sale created: ${resp.sale?.id || resp.sale_id}`);
      // Reset form minimal:
      setLines([]);
      setAmountPaidUsd(0);
      setCustomer(null);
    } catch (e: any) {
      setMsg(`❌ ${e.message || 'Failed to create sale'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display:'grid', gap: 16, maxWidth: 900 }}>
      <h1 className="text-2xl font-semibold">New Sale</h1>

      {msg && <div style={{ padding: 8, background: '#f6f6f6', borderRadius: 6 }}>{msg}</div>}

      {/* Row 1: device, session, store */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color:'#555' }}>Device</label>
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            <option value="">Select device…</option>
            {devices.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color:'#555' }}>Cash session</label>
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">Select session…</option>
            {sessions.filter(s => !s.closed_at).map(s => (
              <option key={s.id} value={s.id}>
                {new Date(s.opened_at).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color:'#555' }}>Store</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="">Select store…</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
          </select>
        </div>
      </div>

      {/* Customer (expects Customer object) */}
      <div>
        <label style={{ fontSize: 12, color:'#555' }}>Customer</label>
        <CustomerPicker value={customer} onChange={setCustomer} />
      </div>

      {/* Products */}
      <ProductPicker value={lines} onChange={setLines} />

      {/* Totals */}
      <div style={{ display:'flex', gap: 16, alignItems:'center' }}>
        <div><strong>Total (USD):</strong> {totalUsd.toFixed(2)}</div>
      </div>

      {/* Payment */}
      <div style={{ display:'grid', gap: 8 }}>
        <label style={{ fontSize: 12, color:'#555' }}>Payment</label>
        <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 1fr', gap: 10, alignItems:'center' }}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as 'USD'|'SOS')}>
            <option value="USD">USD</option>
            <option value="SOS">SOS</option>
          </select>

          <select value={methodAccountId} onChange={(e) => setMethodAccountId(e.target.value)}>
            <option value="">Select cash account…</option>
            {accounts
              .filter(a => a.AccountType?.name === 'CASH_ON_HAND')
              .map(a => <option key={a.id} value={a.id}>{a.name}</option>)
            }
          </select>

          <input
            type="number"
            min={0}
            step="0.01"
            value={amountPaidUsd}
            onChange={(e) => setAmountPaidUsd(Number(e.target.value || 0))}
            placeholder="Paid (USD)"
            style={{ border:'1px solid #ddd', padding: 8, borderRadius: 6 }}
          />
        </div>

        {currency === 'SOS' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap: 10 }}>
            <input
              type="number"
              min={0.0001}
              step="1"
              value={sosRate}
              onChange={(e) => setSosRate(Number(e.target.value || 0))}
              placeholder="Customer rate (SOS per USD)"
              style={{ border:'1px solid #ddd', padding: 8, borderRadius: 6 }}
            />
            <div style={{ fontSize: 12, color:'#666' }}>
              Native amount (SOS) on receipt: {(amountPaidUsd * sosRate).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      <div>
        <button
          disabled={busy}
          onClick={submit}
          style={{ padding:'10px 14px', background:'black', color:'white', borderRadius: 6 }}
        >
          {busy ? 'Saving…' : 'Create Sale'}
        </button>
      </div>
    </div>
  );
}
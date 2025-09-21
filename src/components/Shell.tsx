'use client';

import Link from 'next/link';
import { clearToken, getToken } from '@/lib/token';
import { useRouter } from 'next/navigation';

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function logout() {
    clearToken();
    router.replace('/login');
  }

  const loggedIn = !!getToken();

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui' }}>
      <header style={{
        display: 'flex', gap: 12, alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid #eee'
      }}>
        <strong>Shop POS</strong>
        <nav style={{ display: 'flex', gap: 10 }}>
          <Link href="/">Dashboard</Link>
          <Link href="/sales/listSales">listSales</Link>
          <Link href="/sales/newSales">newSales</Link>
          <Link href="/reports/today">Today</Link>
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          {loggedIn && (
            <button onClick={logout} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
              Logout
            </button>
          )}
        </div>
      </header>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}

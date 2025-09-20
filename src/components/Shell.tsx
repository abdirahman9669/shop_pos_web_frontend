'use client';

import Link from 'next/link';

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: 220, borderRight: '1px solid #eee', padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Shop POS</div>
        <nav style={{ display: 'grid', gap: 8 }}>
          <Link href="/">Dashboard</Link>
          <Link href="/login">Login</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
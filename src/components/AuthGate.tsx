'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/token';

type Props = { children: React.ReactNode };

export default function AuthGate({ children }: Props) {
  const [status, setStatus] = useState<'checking' | 'ok'>('checking');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return; // wait for router
    if (pathname.startsWith('/login')) {
      setStatus('ok'); // allow login page without token
      return;
    }
    const token = getToken();
    if (!token) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }
    setStatus('ok');
  }, [pathname, router]);

  if (status === 'checking') {
    return <div style={{ padding: 24 }}>Checking session…</div>;
  }
  return <>{children}</>;
}
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Props = { children: React.ReactNode };

export default function AuthGate({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem('token');

      // If on /login but token exists, go to next or home
      if (pathname?.startsWith('/login')) {
        if (token) {
          const url = new URL(window.location.href);
          const next = url.searchParams.get('next') || '/';
          router.replace(next);
          return;
        }
        setReady(true);
        return;
      }

      // If NOT on /login and no token, send to login
      if (!token) {
        const next = encodeURIComponent(pathname || '/');
        router.replace(`/login?next=${next}`);
        return;
      }

      setReady(true);
    };

    check();
    // re-check when tab gets focus again
    const onVis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pathname, router]);

  if (!ready) {
    return <div style={{ padding: 24 }}>Checking session…</div>;
  }

  return <>{children}</>;
}
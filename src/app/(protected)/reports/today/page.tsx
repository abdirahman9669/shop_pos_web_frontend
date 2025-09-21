// src/app/(protected)/reports/today/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function TodayPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    apiGet('/api/reports/today')
      .then(setData)
      .catch(e => setErr(e.message || 'Failed'));
  }, []);

  if (err) return <div className="text-red-600">Error: {err}</div>;
  if (!data) return <div>Loading…</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Today</h2>
      <pre className="text-sm bg-gray-50 p-3 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
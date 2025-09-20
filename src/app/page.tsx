import Shell from '@/components/Shell';

export default function HomePage() {
  return (
    <Shell>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Dashboard</h1>
      <p>Welcome! This is a minimal Next.js app.</p>
      <p>Login will set a token into <code>localStorage</code>.</p>
    </Shell>
  );
}
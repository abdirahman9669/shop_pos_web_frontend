// src/app/(auth)/layout.tsx
export const metadata = { title: 'Login – Shop POS' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // No <html> or <body> here!
  return <div style={{ minHeight: '100vh' }}>{children}</div>;
}
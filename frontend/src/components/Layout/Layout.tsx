import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0a0e27' }}>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}

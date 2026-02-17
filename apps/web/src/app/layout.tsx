import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrainBolt - Adaptive Infinite Quiz Platform',
  description: 'Test your knowledge with adaptive difficulty questions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  );
}

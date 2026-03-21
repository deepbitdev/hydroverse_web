import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HYDROVERSE // Combat Systems',
  description: 'Naval combat arena — festival on the water',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

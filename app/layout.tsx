import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Laurino's Task Board",
  description: 'Task management for Laurino\'s restaurant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

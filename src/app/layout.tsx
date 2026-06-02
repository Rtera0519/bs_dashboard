import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BlueQueue - Bluesky予約投稿ダッシュボード',
  description: 'Blueskyへの自動・予約投稿を一括管理するダッシュボードツール',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
        {/* Force loading Material Symbols */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

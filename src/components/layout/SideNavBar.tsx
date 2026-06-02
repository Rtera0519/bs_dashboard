'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'ダッシュボード', icon: 'dashboard' },
    { href: '/posts/new', label: '新規投稿', icon: 'add_circle' },
    { href: '/posts/bulk', label: '一括投稿', icon: 'layers' },
    { href: '/posts', label: '投稿一覧', icon: 'article' },
    { href: '/settings', label: '設定', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] flex flex-col p-md bg-surface border-r border-outline-variant z-20">
      {/* Brand Area */}
      <div className="flex items-center gap-sm mb-xl px-sm pt-sm">
        <div className="h-8 w-8 bg-primary rounded flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined fill text-on-primary text-headline-md font-headline-md">
            water_drop
          </span>
        </div>
        <div>
          <h1 className="text-headline-lg font-headline-lg font-black text-primary tracking-tight">BlueQueue</h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant">Bluesky Manager</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 space-y-xs">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-sm px-sm py-sm rounded-lg transition-colors duration-200 group relative overflow-hidden ${
                isActive
                  ? 'text-primary font-bold bg-surface-container-low'
                  : 'text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <span className="text-label-md font-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Tab */}
      <div className="mt-auto pt-md border-t border-outline-variant">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-sm px-sm py-sm rounded-lg text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface transition-colors duration-200 text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-label-md font-label-md">ログアウト</span>
        </button>
      </div>
    </aside>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'ログインに失敗しました。');
      }
    } catch (err) {
      setError('サーバーとの通信中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center font-body-md text-body-md antialiased bg-background text-on-background">
      <div className="w-full max-w-md p-lg">
        <div className="text-center mb-xl">
          <h1 className="text-display font-display text-primary mb-xs">BlueQueue</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Bluesky投稿を、まとめて予約・管理
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-xl">
          <form onSubmit={handleSubmit} className="space-y-lg">
            {error && (
              <div className="p-md text-error bg-error-container/30 border border-error-container rounded-lg text-label-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <div className="space-y-sm">
              <label className="block text-label-md font-label-md text-on-surface" htmlFor="admin-id">
                Admin ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">person</span>
                </div>
                <input
                  className="block w-full pl-xl pr-sm py-[10px] bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  id="admin-id"
                  name="admin-id"
                  placeholder="管理者IDを入力してください"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  required
                  type="text"
                />
              </div>
            </div>

            <div className="space-y-sm">
              <label className="block text-label-md font-label-md text-on-surface" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">lock</span>
                </div>
                <input
                  className="block w-full pl-xl pr-sm py-[10px] bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  id="password"
                  name="password"
                  placeholder="パスワードを入力してください"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                />
              </div>
            </div>

            <div className="pt-sm">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-[10px] px-md border border-transparent rounded-lg shadow-sm text-label-md font-label-md text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

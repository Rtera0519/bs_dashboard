'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Account } from '@/lib/supabase';

interface SettingsClientProps {
  initialAccount: Account | null;
  cronSecret: string;
}

export default function SettingsClient({ initialAccount, cronSecret }: SettingsClientProps) {
  const router = useRouter();
  const [handle, setHandle] = useState(initialAccount?.handle || '');
  const [displayName, setDisplayName] = useState(initialAccount?.display_name || '');
  const [appPassword, setAppPassword] = useState(''); // Fetch decrypted on mount/fill
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load app password decrypted on mount
  useState(() => {
    if (initialAccount) {
      fetch(`/api/settings/decrypt-password?id=${initialAccount.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.decryptedPassword) {
            setAppPassword(data.decryptedPassword);
          }
        })
        .catch((err) => console.error('Failed to load password:', err));
    }
  });

  const handleTestConnection = async () => {
    if (!handle || !appPassword) {
      alert('ハンドル名とアプリパスワードを入力してください。');
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, appPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `接続成功！ 表示名: ${data.displayName || '未設定'}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `接続失敗: ${data.error || 'ログイン認証エラー'}`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'サーバー通信エラーが発生しました。',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!handle || !appPassword) {
      alert('ハンドル名とアプリパスワードは必須です。');
      return;
    }

    setSaving(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialAccount?.id, // undefined for new account
          handle,
          appPassword,
          displayName,
        }),
      });

      if (res.ok) {
        alert('アカウント設定を保存しました。');
        router.refresh();
      } else {
        const data = await res.json();
        alert(`保存に失敗しました: ${data.error || 'エラー'}`);
      }
    } catch (err) {
      alert('通信エラーが発生しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(cronSecret);
    alert('Cronシークレットをクリップボードにコピーしました！');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
      {/* Left Column (Main Settings) */}
      <div className="lg:col-span-8 flex flex-col gap-lg">
        {/* Bluesky Account Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="px-md py-sm border-b border-outline-variant bg-surface-bright flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            <h3 className="text-headline-md font-headline-md text-on-surface">Blueskyアカウント</h3>
          </div>
          
          <div className="p-md md:p-lg flex flex-col gap-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-label-sm text-on-surface-variant" htmlFor="bsky-handle">
                  ハンドル名 (例: user.bsky.social)
                </label>
                <input
                  className="w-full px-sm py-[10px] rounded border border-outline-variant bg-surface-container-lowest text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  id="bsky-handle"
                  placeholder="例：example.bsky.social"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-label-sm text-on-surface-variant" htmlFor="display-name">
                  表示名 (任意)
                </label>
                <input
                  className="w-full px-sm py-[10px] rounded border border-outline-variant bg-surface-container-lowest text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  id="display-name"
                  placeholder="表示名を入力（例：BlueQueue Bot）"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  type="text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-label-sm font-label-sm text-on-surface-variant" htmlFor="app-password">
                アプリパスワード
              </label>
              <div className="relative">
                <input
                  className="w-full px-sm py-[10px] pr-xl rounded border border-outline-variant bg-surface-container-lowest text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  id="app-password"
                  placeholder="アプリパスワード（例：xxxx-xxxx-xxxx-xxxx）"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">
                通常のログインパスワードではなく、Bluesky設定画面で発行した「アプリパスワード」を使用してください。
              </p>
            </div>

            {testResult && (
              <div
                className={`p-md border rounded-lg text-label-md flex items-center gap-xs ${
                  testResult.success
                    ? 'bg-tertiary-container/10 border-tertiary/30 text-tertiary'
                    : 'bg-error-container/30 border-error-container text-error'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                {testResult.message}
              </div>
            )}

            <div className="flex items-center gap-sm mt-sm pt-md border-t border-outline-variant">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-md py-sm rounded text-label-md font-label-md bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-bright transition-colors cursor-pointer disabled:opacity-50"
              >
                {testing ? 'テスト中...' : '接続テスト'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-md py-sm rounded text-label-md font-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors ml-auto cursor-pointer disabled:opacity-50"
              >
                {saving ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </div>
        </section>

        {/* Default Settings Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="px-md py-sm border-b border-outline-variant bg-surface-bright flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">schedule</span>
            <h3 className="text-headline-md font-headline-md text-on-surface">デフォルト設定</h3>
          </div>
          
          <div className="p-md md:p-lg flex flex-col gap-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-label-sm text-on-surface-variant" htmlFor="post-interval">
                  デフォルトの投稿間隔 (分)
                </label>
                <input
                  className="w-full px-sm py-[10px] rounded border border-outline-variant bg-surface-container-lowest text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="post-interval"
                  type="number"
                  defaultValue={60}
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-label-sm text-on-surface-variant" htmlFor="min-interval">
                  最小間隔 (分)
                </label>
                <input
                  className="w-full px-sm py-[10px] rounded border border-outline-variant bg-surface-container-lowest text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="min-interval"
                  type="number"
                  defaultValue={15}
                />
              </div>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm font-label-sm text-on-surface-variant" htmlFor="default-time">
                デフォルトの毎日の開始時間
              </label>
              <input
                className="w-full md:w-1/2 px-sm py-[10px] rounded border border-outline-variant bg-surface-container-lowest text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                id="default-time"
                type="time"
                defaultValue="09:00"
              />
            </div>
            <div className="flex items-center gap-sm mt-sm pt-md border-t border-outline-variant">
              <button
                type="button"
                onClick={() => alert('デフォルト設定を保存しました。')}
                className="px-md py-sm rounded text-label-md font-label-md bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-bright transition-colors ml-auto cursor-pointer"
              >
                デフォルトを更新
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column (Secondary Settings/Info) */}
      <div className="lg:col-span-4 flex flex-col gap-lg">
        {/* Security Info Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="px-md py-sm border-b border-outline-variant bg-surface-bright flex items-center gap-sm">
            <span className="material-symbols-outlined text-tertiary">lock</span>
            <h3 className="text-headline-md font-headline-md text-on-surface">セキュリティ</h3>
          </div>
          
          <div className="p-md flex flex-col gap-md">
            <div className="bg-surface-container-low p-sm rounded border border-outline-variant/50">
              <h4 className="text-label-md font-label-md text-on-surface flex items-center gap-xs mb-xs">
                <span className="material-symbols-outlined text-[16px]">info</span> アプリパスワード
              </h4>
              <p className="text-body-sm font-body-sm text-on-surface-variant">
                BlueskyのアプリパスワードはAES-256を使用して保存時に暗号化されます。プライマリアカウントのパスワードを保存することは決してありません。
              </p>
            </div>
            
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm font-label-sm text-on-surface-variant">
                Cronトリガーシークレット
              </label>
              <div className="flex items-center gap-sm">
                <code className="flex-1 bg-surface-container px-sm py-[6px] rounded text-body-sm font-mono text-on-surface overflow-hidden text-ellipsis whitespace-nowrap border border-outline-variant/30">
                  {cronSecret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="p-xs text-on-surface-variant hover:text-primary transition-colors rounded hover:bg-surface-container cursor-pointer"
                  title="シークレットをコピー"
                >
                  <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
              </div>
              <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">
                このシークレットを使用して外部のcronジョブを認証します。
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => alert('シークレットを再生成しました（ダミー処理です）。')}
              className="w-full px-md py-sm rounded text-label-md font-label-md bg-surface-container-lowest border border-outline-variant text-error hover:bg-error-container hover:text-on-error-container transition-colors mt-sm cursor-pointer"
            >
              シークレットをローテーション
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

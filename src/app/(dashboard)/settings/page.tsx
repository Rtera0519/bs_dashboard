import { db } from '@/lib/supabase';
import TopNavBar from '@/components/layout/TopNavBar';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const accounts = await db.getAccounts();
  const firstAccount = accounts.length > 0 ? accounts[0] : null;
  const cronSecret = process.env.CRON_SECRET || 'sk_cron_9a8b7c6d5e4f3g2h1';

  return (
    <>
      <TopNavBar title="設定" />
      <main className="flex-1 overflow-y-auto p-md md:p-lg">
        <div className="max-w-container-max mx-auto w-full flex-1">
          <div className="mb-lg">
            <h2 className="text-display font-display text-on-surface">設定</h2>
            <p className="text-body-md font-body-md text-on-surface-variant mt-xs">
              Blueskyの接続と投稿設定を管理します。
            </p>
          </div>
          <SettingsClient
            initialAccount={firstAccount}
            cronSecret={cronSecret}
          />
        </div>
      </main>
    </>
  );
}

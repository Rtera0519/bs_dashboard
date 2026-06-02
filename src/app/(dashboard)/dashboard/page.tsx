import { db } from '@/lib/supabase';
import TopNavBar from '@/components/layout/TopNavBar';
import DashboardClient from './DashboardClient';

// Force dynamic rendering to ensure DB updates show up instantly
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const posts = await db.getPosts();
  const accounts = await db.getAccounts();
  const displayName = accounts[0]?.display_name || 'ゲスト';

  return (
    <>
      <TopNavBar title="ダッシュボード" />
      <main className="flex-1 overflow-y-auto p-lg pb-xl">
        <DashboardClient
          initialPosts={posts}
          accounts={accounts}
          displayName={displayName}
        />
      </main>
    </>
  );
}

import { db } from '@/lib/supabase';
import TopNavBar from '@/components/layout/TopNavBar';
import NewPostClient from './NewPostClient';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const accounts = await db.getAccounts();

  return (
    <>
      <TopNavBar title="新規投稿" />
      <main className="flex-1 overflow-y-auto p-lg pb-xl">
        <div className="max-w-container-max mx-auto w-full">
          <div className="mb-lg">
            <h1 className="text-display font-display text-on-surface">新規投稿</h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant mt-sm">
              Blueskyの次のアップデートを作成してスケジュールします。
            </p>
          </div>
          <NewPostClient accounts={accounts} />
        </div>
      </main>
    </>
  );
}

import { db } from '@/lib/supabase';
import TopNavBar from '@/components/layout/TopNavBar';
import BulkPostClient from './BulkPostClient';

export const dynamic = 'force-dynamic';

export default async function BulkPostPage() {
  const accounts = await db.getAccounts();

  return (
    <>
      <TopNavBar title="一括投稿" />
      <main className="flex-1 overflow-y-auto p-lg md:p-xl">
        <div className="max-w-container-max mx-auto w-full">
          {/* Page Header */}
          <div className="mb-lg">
            <h2 className="text-display font-display text-on-surface mb-xs">一括投稿</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant">
              1行1投稿としてまとめて予約できます
            </p>
          </div>
          <BulkPostClient accounts={accounts} />
        </div>
      </main>
    </>
  );
}

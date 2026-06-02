import { db } from '@/lib/supabase';
import TopNavBar from '@/components/layout/TopNavBar';
import PostListClient from './PostListClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function PostsPage() {
  const posts = await db.getPosts();
  const accounts = await db.getAccounts();

  return (
    <>
      <TopNavBar title="投稿一覧" />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-xl text-center">読み込み中...</div>}>
          <PostListClient initialPosts={posts} accounts={accounts} />
        </Suspense>
      </main>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post, Account } from '@/lib/supabase';

interface DashboardClientProps {
  initialPosts: Post[];
  accounts: Account[];
  displayName: string;
}

export default function DashboardClient({ initialPosts, accounts, displayName }: DashboardClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Statistics calculation
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  
  // Calculate today's posts (Local time)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  
  const todayPosts = posts.filter((p) => {
    if (!p.scheduled_at) return false;
    const d = new Date(p.scheduled_at).getTime();
    return d >= startOfToday && d <= endOfToday;
  });
  
  const todayCount = todayPosts.length;
  const todayRemaining = todayPosts.filter((p) => p.status === 'scheduled').length;
  
  const postedCount = posts.filter((p) => p.status === 'posted').length;
  const failedCount = posts.filter((p) => p.status === 'failed').length;

  const recentScheduled = posts
    .filter((p) => p.status === 'scheduled' || p.status === 'draft')
    .slice(0, 5);

  const recentFailed = posts
    .filter((p) => p.status === 'failed')
    .slice(0, 5);

  // Success rate computation
  const totalCompleted = postedCount + failedCount;
  const successRate = totalCompleted > 0 ? ((postedCount / totalCompleted) * 100).toFixed(1) : '100.0';

  const handleRetry = async (postId: string) => {
    if (retryingId) return;
    setRetryingId(postId);

    try {
      const res = await fetch(`/api/posts/${postId}/publish`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        alert('再投稿に成功しました！');
        // Refresh page data
        router.refresh();
        // Fetch updated posts
        const postsRes = await fetch('/api/posts');
        if (postsRes.ok) {
          const updatedPosts = await postsRes.json();
          setPosts(updatedPosts);
        }
      } else {
        alert(`再投稿に失敗しました: ${data.error || '不明なエラー'}`);
      }
    } catch (err) {
      alert('サーバー通信エラーが発生しました。');
    } finally {
      setRetryingId(null);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '未設定';
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-container-max mx-auto space-y-xl">
      {/* Welcome Section */}
      <div className="flex items-end justify-between pb-sm">
        <div>
          <h1 className="text-display font-display text-on-surface mb-xs">
            こんにちは、{displayName}さん。
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            本日のBluesky予約状況です。
          </p>
        </div>
        <div>
          <Link
            href="/posts/new"
            className="bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md font-label-md font-medium hover:bg-surface-tint transition-colors shadow-sm flex items-center gap-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            新規投稿
          </Link>
        </div>
      </div>

      {/* Stats Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Card 1: Scheduled */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col justify-between group hover:border-outline transition-colors">
          <div className="flex justify-between items-start mb-lg">
            <span className="text-label-md font-label-md text-on-surface-variant">予約中</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            </div>
          </div>
          <div>
            <span className="text-display font-display text-on-surface tracking-tight">
              {scheduledCount}
            </span>
            <div className="flex items-center gap-xs mt-xs text-on-surface-variant">
              <span className="text-label-sm font-label-sm">キューに保留中</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col justify-between group hover:border-outline transition-colors">
          <div className="flex justify-between items-start mb-lg">
            <span className="text-label-md font-label-md text-on-surface-variant">本日の投稿</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">today</span>
            </div>
          </div>
          <div>
            <span className="text-display font-display text-on-surface tracking-tight">
              {todayCount}
            </span>
            <div className="flex items-center gap-xs mt-xs text-on-surface-variant">
              <span className="text-label-sm font-label-sm">{todayRemaining} 件未送信</span>
            </div>
          </div>
        </div>

        {/* Card 3: Posted */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col justify-between group hover:border-outline transition-colors">
          <div className="flex justify-between items-start mb-lg">
            <span className="text-label-md font-label-md text-on-surface-variant">投稿済み</span>
            <div className="w-8 h-8 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          </div>
          <div>
            <span className="text-display font-display text-on-surface tracking-tight">
              {postedCount}
            </span>
            <div className="flex items-center gap-xs mt-xs text-tertiary">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span className="text-label-sm font-label-sm">{successRate}% 成功率</span>
            </div>
          </div>
        </div>

        {/* Card 4: Failed */}
        <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col justify-between group hover:border-error-container transition-colors relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-error-container/10 to-transparent pointer-events-none"></div>
          <div className="flex justify-between items-start mb-lg relative z-10">
            <span className="text-label-md font-label-md text-error">失敗</span>
            <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">error</span>
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-display font-display text-error tracking-tight">
              {failedCount}
            </span>
            <div className="flex items-center gap-xs mt-xs text-on-surface-variant">
              <span className="text-label-sm font-label-sm">要アクション</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout (8/4 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Scheduled Posts Area */}
        <div className="lg:col-span-8 bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
            <h3 className="text-headline-md font-headline-md text-on-surface">直近の予約投稿</h3>
            <Link href="/posts" className="text-primary text-label-md font-label-md hover:underline">
              全て表示
            </Link>
          </div>
          <div className="divide-y divide-outline-variant">
            {recentScheduled.length === 0 ? (
              <div className="p-lg text-center text-on-surface-variant/75 text-body-md">
                予約中または下書きの投稿はありません。
              </div>
            ) : (
              recentScheduled.map((post) => {
                const account = accounts.find((a) => a.id === post.account_id);
                return (
                  <div key={post.id} className="p-lg flex gap-md hover:bg-surface-container-lowest transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0 border border-outline-variant flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined">
                        {post.status === 'draft' ? 'short_text' : 'schedule'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-xs">
                        <p className="text-body-md font-body-md text-on-surface font-medium truncate max-w-[80%]">
                          {post.text}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-container-high text-on-surface text-label-sm font-label-sm whitespace-nowrap">
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              post.status === 'draft' ? 'bg-outline' : 'bg-primary'
                            }`}
                          ></span>
                          {post.status === 'draft' ? '下書き' : '予約中'}
                        </span>
                      </div>
                      <div className="flex items-center gap-md text-body-sm font-body-sm text-on-surface-variant">
                        <span className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {post.status === 'draft' ? '日時未設定' : formatTime(post.scheduled_at)}
                        </span>
                        {account && (
                          <span className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[14px]">account_circle</span>
                            @{account.handle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center pl-sm">
                      <Link
                        href={`/posts?edit=${post.id}`}
                        className="text-outline hover:text-primary p-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Failed Posts Area */}
        <div className="lg:col-span-4 bg-error-container/30 border border-error-container rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-md py-md border-b border-error-container/50 bg-error-container/50 flex justify-between items-center">
            <h3 className="text-label-md font-label-md text-on-error-container font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              直近の失敗投稿
            </h3>
          </div>
          <div className="divide-y divide-error-container/30 bg-surface/50">
            {recentFailed.length === 0 ? (
              <div className="p-md text-center text-on-surface-variant/75 text-body-sm">
                失敗した投稿はありません。
              </div>
            ) : (
              recentFailed.map((post) => (
                <div key={post.id} className="p-md hover:bg-surface/80 transition-colors">
                  <div className="flex items-start gap-sm mb-xs">
                    <div className="mt-1 w-2 h-2 rounded-full bg-error shrink-0"></div>
                    <p className="text-body-sm font-body-sm text-on-surface line-clamp-2">
                      {post.text}
                    </p>
                  </div>
                  {post.error_message && (
                    <p className="text-body-sm font-body-sm text-error/90 pl-md italic">
                      エラー: {post.error_message}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-sm pl-md">
                    <span className="text-label-sm font-label-sm text-on-surface-variant">
                      {formatTime(post.scheduled_at)}
                    </span>
                    <button
                      onClick={() => handleRetry(post.id)}
                      disabled={retryingId === post.id}
                      className="text-label-sm font-label-sm text-error font-medium hover:underline flex items-center gap-xs cursor-pointer disabled:opacity-50"
                    >
                      {retryingId === post.id ? '再試行中...' : '再試行'}
                      <span className="material-symbols-outlined text-[14px]">refresh</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-sm bg-surface/80 border-t border-error-container/30 text-center">
            <Link
              href="/posts?filter=failed"
              className="text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface hover:underline"
            >
              エラーログを表示
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

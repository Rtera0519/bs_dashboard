'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Post, Account } from '@/lib/supabase';

interface PostListClientProps {
  initialPosts: Post[];
  accounts: Account[];
}

export default function PostListClient({ initialPosts, accounts }: PostListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const filterParam = searchParams.get('filter');

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'scheduled' | 'posted' | 'failed'>('all');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Tab filter from search param
  useEffect(() => {
    if (filterParam && ['all', 'draft', 'scheduled', 'posted', 'failed'].includes(filterParam)) {
      setActiveTab(filterParam as any);
    }
  }, [filterParam]);

  // Edit modal trigger from search param or local state
  useEffect(() => {
    if (editParam) {
      const post = posts.find((p) => p.id === editParam);
      if (post) {
        startEditing(post);
      }
    }
  }, [editParam, posts]);

  const startEditing = (post: Post) => {
    setEditingPost(post);
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at);
      setEditDate(d.toISOString().split('T')[0]);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setEditTime(`${hours}:${minutes}`);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEditDate(tomorrow.toISOString().split('T')[0]);
      setEditTime('09:00');
    }
  };

  const closeEditing = () => {
    setEditingPost(null);
    // Remove query parameter if present
    if (editParam) {
      router.push('/posts');
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この投稿を削除してもよろしいですか？')) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id));
        router.refresh();
      } else {
        alert('削除に失敗しました。');
      }
    } catch (err) {
      alert('通信エラーが発生しました。');
    } finally {
      setLoadingId(null);
    }
  };

  const handlePublishNow = async (id: string) => {
    if (!confirm('この投稿を今すぐBlueskyに投稿しますか？')) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('投稿を公開しました！');
        fetchPosts();
        router.refresh();
      } else {
        alert(`投稿に失敗しました: ${data.error || '不明なエラー'}`);
      }
    } catch (err) {
      alert('通信エラーが発生しました。');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('この投稿のスケジュール予約を解除し、下書きに戻しますか？')) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          scheduledAt: null,
        }),
      });

      if (res.ok) {
        alert('予約を解除し、下書きに保存しました。');
        fetchPosts();
        router.refresh();
      } else {
        alert('予約解除に失敗しました。');
      }
    } catch (err) {
      alert('通信エラーが発生しました。');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editingPost.text.trim()) {
      alert('本文を入力してください。');
      return;
    }
    if (editingPost.text.length > 300) {
      alert('300文字以内で入力してください。');
      return;
    }

    setSavingEdit(true);
    try {
      // Calculate new scheduled date
      let newScheduledAt: string | null = null;
      let newStatus = editingPost.status;

      if (editingPost.status === 'scheduled') {
        if (!editDate || !editTime) {
          alert('予約日時を設定してください。');
          setSavingEdit(false);
          return;
        }
        newScheduledAt = new Date(`${editDate}T${editTime}`).toISOString();
        if (new Date(newScheduledAt).getTime() <= Date.now()) {
          alert('予約日時は現在時刻より後の日時を指定してください。');
          setSavingEdit(false);
          return;
        }
      } else if (editingPost.status === 'draft' && editDate && editTime) {
        // If draft and date/time are edited, optionally allow upgrading to scheduled
        if (confirm('予約日時を設定しました。スケジュール投稿に変更しますか？')) {
          newStatus = 'scheduled';
          newScheduledAt = new Date(`${editDate}T${editTime}`).toISOString();
        }
      }

      const res = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editingPost.text,
          status: newStatus,
          scheduledAt: newScheduledAt,
          errorMessage: null, // Clear error on edit
        }),
      });

      if (res.ok) {
        alert('投稿を更新しました！');
        closeEditing();
        fetchPosts();
        router.refresh();
      } else {
        const data = await res.json();
        alert(`更新に失敗しました: ${data.error || 'エラー'}`);
      }
    } catch (err) {
      alert('通信エラーが発生しました。');
    } finally {
      setSavingEdit(false);
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDuplicate = async (post: Post) => {
    setLoadingId(post.id);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: post.account_id,
          text: `${post.text} (複製)`,
          status: 'draft',
          scheduledAt: null,
        }),
      });
      
      if (res.ok) {
        alert('下書きとして複製しました！');
        fetchPosts();
        router.refresh();
      } else {
        alert('複製の作成に失敗しました。');
      }
    } catch (err) {
      alert('通信エラーが発生しました。');
    } finally {
      setLoadingId(null);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === 'all' || post.status === activeTab;
    const matchesSearch = post.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-lg lg:p-xl max-w-container-max mx-auto w-full">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
        <h2 className="text-display font-display text-on-surface">投稿</h2>
        <div className="flex flex-1 max-w-md items-center bg-surface-container-lowest border border-outline-variant rounded-lg px-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <input
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 py-sm"
            placeholder="投稿を検索..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex overflow-x-auto gap-sm mb-lg pb-sm border-b border-outline-variant scrollbar-hide">
        {(['all', 'draft', 'scheduled', 'posted', 'failed'] as const).map((tab) => {
          const labels = {
            all: 'すべて',
            draft: '下書き',
            scheduled: '予約中',
            posted: '投稿済み',
            failed: '失敗',
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-md py-sm text-label-md font-label-md transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-t-lg'
              }`}
            >
              {labels[tab]} ({posts.filter((p) => tab === 'all' || p.status === tab).length})
            </button>
          );
        })}
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="p-md font-medium">コンテンツ</th>
                <th className="p-md font-medium w-32">ステータス</th>
                <th className="p-md font-medium w-48">予約日時</th>
                <th className="p-md font-medium w-48">投稿日時</th>
                <th className="p-md font-medium w-44 text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="text-body-md font-body-md divide-y divide-outline-variant/50">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-xl text-center text-on-surface-variant/75 text-body-md">
                    該当する投稿はありません。
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const account = accounts.find((a) => a.id === post.account_id);
                  const isRowLoading = loadingId === post.id;

                  return (
                    <tr
                      key={post.id}
                      className={`hover:bg-surface-container-low/30 transition-colors ${
                        post.status === 'failed' ? 'bg-error/5' : ''
                      } ${isRowLoading ? 'opacity-50' : ''}`}
                    >
                      <td className="p-md">
                        <div className="flex items-start gap-sm max-w-md">
                          <div className="w-10 h-10 rounded bg-surface-container-high flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined text-on-surface-variant">
                              {post.status === 'draft'
                                ? 'drafts'
                                : post.status === 'failed'
                                ? 'error'
                                : post.status === 'posted'
                                ? 'check_circle'
                                : 'schedule'}
                            </span>
                          </div>
                          <div>
                            <p className="text-on-surface line-clamp-2">{post.text}</p>
                            {post.status === 'failed' && post.error_message && (
                              <p className="text-label-sm font-label-sm text-error mt-1 flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {post.error_message}
                              </p>
                            )}
                            {account && (
                              <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">
                                アカウント: @{account.handle}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-md">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            post.status === 'scheduled'
                              ? 'bg-primary/10 text-primary'
                              : post.status === 'posted'
                              ? 'bg-tertiary/10 text-tertiary'
                              : post.status === 'failed'
                              ? 'bg-error/10 text-error'
                              : 'bg-outline/10 text-outline'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              post.status === 'scheduled'
                                ? 'bg-primary'
                                : post.status === 'posted'
                                ? 'bg-tertiary'
                                : post.status === 'failed'
                                ? 'bg-error'
                                : 'bg-outline'
                            }`}
                          ></span>
                          {post.status === 'scheduled'
                            ? '予約中'
                            : post.status === 'posted'
                            ? '投稿済み'
                            : post.status === 'failed'
                            ? '失敗'
                            : '下書き'}
                        </span>
                      </td>
                      <td className="p-md text-on-surface-variant">
                        {formatTime(post.scheduled_at)}
                      </td>
                      <td className="p-md text-on-surface-variant">
                        {formatTime(post.posted_at)}
                      </td>
                      <td className="p-md">
                        <div className="flex items-center justify-end gap-xs">
                          {/* Row Actions based on Status */}
                          {post.status === 'draft' && (
                            <>
                              <button
                                onClick={() => startEditing(post)}
                                className="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                                title="編集"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="p-xs text-on-surface-variant hover:text-error hover:bg-error-container rounded transition-colors cursor-pointer"
                                title="削除"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </>
                          )}

                          {post.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handlePublishNow(post.id)}
                                className="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                                title="今すぐ投稿"
                              >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                              </button>
                              <button
                                onClick={() => handleCancelSchedule(post.id)}
                                className="p-xs text-on-surface-variant hover:text-outline hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                                title="予約解除（下書きへ）"
                              >
                                <span className="material-symbols-outlined text-[20px]">unpublished</span>
                              </button>
                              <button
                                onClick={() => startEditing(post)}
                                className="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                                title="日時編集"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="p-xs text-on-surface-variant hover:text-error hover:bg-error-container rounded transition-colors cursor-pointer"
                                title="削除"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </>
                          )}

                          {post.status === 'posted' && (
                            <>
                              {post.bluesky_uri && (
                                <a
                                  href={`https://bsky.app/profile/${account?.handle || ''}/post/${post.bluesky_uri.split('/').pop()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors inline-block"
                                  title="Blueskyで表示"
                                >
                                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                </a>
                              )}
                              <button
                                onClick={() => handleDuplicate(post)}
                                className="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                                title="複製して新規作成"
                              >
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                              </button>
                            </>
                          )}

                          {post.status === 'failed' && (
                            <>
                              <button
                                onClick={() => handlePublishNow(post.id)}
                                className="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                                title="再投稿"
                              >
                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                              </button>
                              <button
                                onClick={() => startEditing(post)}
                                className="p-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded transition-colors cursor-pointer"
                                title="編集"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="p-xs text-on-surface-variant hover:text-error hover:bg-error-container rounded transition-colors cursor-pointer"
                                title="削除"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Edit Modal Overlay */}
      {editingPost && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-lg p-lg flex flex-col gap-md relative">
            <button
              onClick={closeEditing}
              className="absolute top-md right-md text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-headline-md font-headline-md text-on-surface border-b border-outline-variant pb-sm">
              投稿を編集
            </h3>
            
            <form onSubmit={handleSaveEditSubmit} className="space-y-md">
              <div className="space-y-xs">
                <label className="text-label-md font-label-md text-on-surface">本文</label>
                <textarea
                  value={editingPost.text}
                  onChange={(e) => setEditingPost({ ...editingPost, text: e.target.value })}
                  rows={4}
                  className="w-full bg-surface border border-outline-variant rounded-lg p-md text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="本文を入力してください..."
                  required
                />
                <div className="text-right text-label-sm text-on-surface-variant">
                  <span className={editingPost.text.length > 300 ? 'text-error font-bold' : ''}>
                    {editingPost.text.length}
                  </span>
                  /300 文字
                </div>
              </div>

              {editingPost.status === 'scheduled' && (
                <div className="grid grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <label className="text-label-md font-label-md text-on-surface">予約日</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg p-sm text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="text-label-md font-label-md text-on-surface">予約時間</label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg p-sm text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant">
                <button
                  type="button"
                  onClick={closeEditing}
                  className="px-md py-sm rounded border border-outline-variant bg-surface text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-md py-sm rounded bg-primary text-on-primary text-label-md font-label-md hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? '保存中...' : '変更を保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

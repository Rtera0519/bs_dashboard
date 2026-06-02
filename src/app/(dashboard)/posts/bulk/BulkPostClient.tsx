'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Account } from '@/lib/supabase';

interface BulkPostClientProps {
  accounts: Account[];
}

interface ParsedPost {
  index: number;
  text: string;
  charCount: number;
  isValid: boolean;
  scheduledTimeStr: string;
  errorMessage?: string;
}

export default function BulkPostClient({ accounts }: BulkPostClientProps) {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [text, setText] = useState(
    "パブリッシングエンジンに大幅なアップデートを適用しました！より高速で安定しています。\n" +
    "来週、新機能をリリース予定です。お楽しみに！\n" +
    "これはサンプル投稿です。このテキストボックスを編集して、複数の投稿を同時にスケジュールできます。各行が個別の予約投稿として登録されます。"
  );
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [parsedPosts, setParsedPosts] = useState<ParsedPost[]>([]);

  // Set initial dates
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Recalculate parsed previews when inputs change
  useEffect(() => {
    if (!startDate || !startTime) {
      setParsedPosts([]);
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
    if (isNaN(startDateTime)) {
      setParsedPosts([]);
      return;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsed = lines.map((line, idx) => {
      const scheduledTime = new Date(startDateTime + idx * intervalMinutes * 60 * 1000);
      const timeStr = scheduledTime.toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const charCount = line.length;
      const isValid = charCount <= 300;
      let errorMessage = undefined;
      if (!isValid) {
        errorMessage = '文字数オーバー';
      }

      return {
        index: idx + 1,
        text: line,
        charCount,
        isValid,
        scheduledTimeStr: timeStr,
        errorMessage,
      };
    });

    setParsedPosts(parsed);
  }, [text, startDate, startTime, intervalMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedPosts.length === 0) {
      alert('有効な投稿がありません。');
      return;
    }

    const hasErrors = parsedPosts.some(p => !p.isValid);
    if (hasErrors) {
      alert('エラー（文字数超過など）のある投稿が含まれています。修正してください。');
      return;
    }

    if (!confirm(`${parsedPosts.length}件の予約投稿を一括登録しますか？`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          bulkText: text,
          startAt: new Date(`${startDate}T${startTime}`).toISOString(),
          intervalMinutes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '一括登録に失敗しました。');
      }

      alert(`${parsedPosts.length}件の投稿を一括登録しました！`);
      router.push('/posts');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
      {/* Left Column: Input Form (Col span 7) */}
      <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-lg">
        <form onSubmit={handleSubmit} className="space-y-lg">
          {/* Account Selector */}
          <div className="space-y-xs">
            <label className="block text-label-md font-label-md text-on-surface">アカウント</label>
            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full appearance-none bg-surface border border-outline-variant text-on-surface text-body-md font-body-md rounded-lg px-md py-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.display_name || acc.handle} (@{acc.handle})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* Bulk Textarea */}
          <div className="space-y-xs">
            <div className="flex justify-between items-baseline">
              <label className="block text-label-md font-label-md text-on-surface">投稿内容</label>
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                改行（Enterキー）で新しい投稿に分割されます
              </span>
            </div>
            <textarea
              className="w-full bg-surface border border-outline-variant text-on-surface text-body-md font-body-md rounded-lg px-md py-md min-h-[280px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow resize-y"
              placeholder="1行目: 投稿文1&#10;2行目: 投稿文2&#10;3行目: 投稿文3"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Scheduling Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-sm border-t border-outline-variant/50">
            {/* Start Time */}
            <div className="space-y-xs">
              <label className="block text-label-md font-label-md text-on-surface">開始時間</label>
              <div className="relative">
                <input
                  className="w-full bg-surface border border-outline-variant text-on-surface text-body-md font-body-md rounded-lg pl-xl pr-md py-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                </div>
              </div>
              <div className="relative mt-2">
                <input
                  className="w-full bg-surface border border-outline-variant text-on-surface text-body-md font-body-md rounded-lg pl-xl pr-md py-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
              </div>
            </div>

            {/* Post Interval */}
            <div className="space-y-xs">
              <label className="block text-label-md font-label-md text-on-surface">投稿間隔</label>
              <div className="relative">
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                  className="w-full appearance-none bg-surface border border-outline-variant text-on-surface text-body-md font-body-md rounded-lg px-md py-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
                >
                  <option value={15}>15分</option>
                  <option value={30}>30分</option>
                  <option value={60}>1時間</option>
                  <option value={120}>2時間</option>
                  <option value={180}>3時間</option>
                  <option value={1440}>1日</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-md flex justify-end">
            <button
              type="submit"
              disabled={loading || parsedPosts.length === 0}
              className="bg-primary text-on-primary font-label-md text-label-md px-xl py-sm rounded-lg hover:bg-surface-tint transition-colors shadow-sm flex items-center gap-sm cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send_and_archive</span>
              {loading ? '登録中...' : '一括登録'}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live Preview (Col span 5) */}
      <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-[650px]">
        {/* Preview Header */}
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright rounded-t-xl">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">visibility</span>
            <h3 className="text-headline-md font-headline-md text-on-surface">プレビュー</h3>
          </div>
          <span className="bg-surface-container-highest text-on-surface px-sm py-xs rounded text-label-sm font-label-sm">
            {parsedPosts.length}件の投稿を検出
          </span>
        </div>

        {/* Preview List Container */}
        <div className="flex-1 overflow-y-auto p-md space-y-md bg-[#fafafa]">
          {parsedPosts.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant/75 text-body-md">
              テキストボックスに投稿文を入力してください。
            </div>
          ) : (
            parsedPosts.map((post) => (
              <div
                key={post.index}
                className={`border rounded-lg p-md shadow-sm relative transition-colors ${
                  post.isValid
                    ? 'bg-surface-container-lowest border-outline-variant'
                    : 'bg-error-container border-error/50 text-on-error-container'
                }`}
              >
                <div className="absolute top-md right-md text-label-sm font-label-sm text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>{' '}
                  {post.scheduledTimeStr}
                </div>
                <div className="flex items-center gap-sm mb-sm">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-label-sm ${
                      post.isValid
                        ? 'bg-surface-container-high text-on-surface'
                        : 'bg-error text-on-error'
                    }`}
                  >
                    {post.index}
                  </span>
                  <span
                    className={`text-label-sm font-label-sm ${
                      post.isValid ? 'text-tertiary' : 'text-error font-bold flex items-center gap-xs'
                    }`}
                  >
                    {!post.isValid && <span className="material-symbols-outlined text-[14px]">warning</span>}
                    {post.isValid ? '有効' : post.errorMessage}
                  </span>
                </div>
                <p className="text-body-md font-body-md mb-sm line-clamp-3">{post.text}</p>
                <div
                  className={`text-label-sm font-label-sm ${
                    post.isValid ? 'text-on-surface-variant' : 'text-error font-bold'
                  }`}
                >
                  {post.charCount} / 300 文字
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Account } from '@/lib/supabase';

interface NewPostClientProps {
  accounts: Account[];
}

export default function NewPostClient({ accounts }: NewPostClientProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Character counter configuration
  const maxChars = 300;
  const isOverLimit = text.length > maxChars;

  // Set default date/time (today or tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('09:00');
  }, []);

  const handleSave = async (status: 'draft' | 'scheduled' | 'publish-now') => {
    if (!text.trim()) {
      alert('本文を入力してください。');
      return;
    }
    if (isOverLimit) {
      alert('300文字以内で入力してください。');
      return;
    }

    let scheduledAt: string | null = null;
    if (status === 'scheduled') {
      if (!date || !time) {
        alert('予約日時を入力してください。');
        return;
      }
      scheduledAt = new Date(`${date}T${time}`).toISOString();
      if (new Date(scheduledAt).getTime() <= Date.now()) {
        alert('予約日時は現在時刻より後の日時を指定してください。');
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Create post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          text,
          status: status === 'publish-now' ? 'draft' : status,
          scheduledAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '投稿の保存に失敗しました。');
      }

      // 2. Publish immediately if requested
      if (status === 'publish-now') {
        const publishRes = await fetch(`/api/posts/${data.id}/publish`, {
          method: 'POST',
        });
        const publishData = await publishRes.json();
        if (!publishRes.ok) {
          throw new Error(publishData.error || '即時投稿に失敗しました。');
        }
        alert('投稿を公開しました！');
      } else {
        alert(status === 'draft' ? '下書きを保存しました。' : '予約を設定しました。');
      }

      router.push('/posts');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
      {/* Left Column: Form Editor */}
      <div className="lg:col-span-7 space-y-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          {/* Account Selector */}
          <div className="mb-md">
            <label className="block text-label-md font-label-md text-on-surface mb-xs">投稿者</label>
            {accounts.length === 0 ? (
              <div className="text-body-sm text-error">
                アカウントが登録されていません。設定画面で登録してください。
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full appearance-none bg-surface border border-outline-variant rounded-lg p-sm hover:border-primary transition-colors text-body-md font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
            )}
          </div>

          {/* Content Textarea */}
          <div className="mb-sm relative">
            <label className="sr-only" htmlFor="post-content">
              投稿内容
            </label>
            <textarea
              className={`w-full bg-surface border rounded-lg p-md pb-12 text-body-lg font-body-lg text-on-surface focus:ring-2 focus:ring-opacity-20 focus:outline-none resize-none ${
                isOverLimit
                  ? 'border-error focus:ring-error focus:border-error'
                  : 'border-outline-variant focus:ring-primary focus:border-primary'
              }`}
              id="post-content"
              placeholder="いまどうしてる？"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
            ></textarea>
            
            {/* Toolbar Icons & Character Counter */}
            <div className="absolute bottom-3 left-4 flex gap-sm text-on-surface-variant">
              <button
                type="button"
                className="p-xs hover:text-primary transition-colors hover:bg-surface-container rounded-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">image</span>
              </button>
              <button
                type="button"
                className="p-xs hover:text-primary transition-colors hover:bg-surface-container rounded-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">link</span>
              </button>
              <button
                type="button"
                className="p-xs hover:text-primary transition-colors hover:bg-surface-container rounded-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
              </button>
            </div>
            
            <div
              className={`absolute bottom-3 right-4 text-label-sm font-label-sm ${
                isOverLimit ? 'text-error font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span>{text.length}</span>/300
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-md mb-lg">
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-xs">日付</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
                  calendar_today
                </span>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg py-sm pl-xl pr-sm text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:ring-opacity-20 focus:border-primary focus:outline-none"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-xs">時間</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
                  schedule
                </span>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg py-sm pl-xl pr-sm text-body-md font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:ring-opacity-20 focus:border-primary focus:outline-none"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-md pt-md border-t border-outline-variant">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave('draft')}
              className="px-md py-sm rounded-lg text-label-md font-label-md text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
            >
              下書き保存
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave('scheduled')}
              className="px-md py-sm rounded-lg border border-outline-variant bg-surface text-label-md font-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              スケジュール
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave('publish-now')}
              className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity shadow-sm flex items-center gap-xs cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {loading ? '送信中...' : '今すぐ投稿'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Preview */}
      <div className="lg:col-span-5">
        <div className="sticky top-[100px]">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">visibility</span>
            プレビュー
          </h3>
          
          {/* Bluesky Post Card Preview */}
          <div className="glass-card rounded-xl p-md shadow-sm">
            <div className="flex gap-md">
              <div className="w-12 h-12 rounded-full bg-primary/20 shrink-0 border border-outline-variant flex items-center justify-center text-primary font-bold">
                {selectedAccount?.display_name?.[0] || selectedAccount?.handle?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-xs mb-xs">
                  <span className="text-label-md font-label-md font-bold text-on-surface truncate max-w-[120px]">
                    {selectedAccount?.display_name || 'Display Name'}
                  </span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant truncate max-w-[150px]">
                    @{selectedAccount?.handle || 'handle.bsky.social'}
                  </span>
                  <span className="text-label-sm font-label-sm text-on-surface-variant ml-auto shrink-0">
                    たった今
                  </span>
                </div>
                <div className="text-body-lg font-body-lg text-on-surface whitespace-pre-wrap break-words min-h-[50px]">
                  {text.trim() === '' ? (
                    <span className="text-on-surface-variant italic opacity-50">
                      投稿内容がここに表示されます...
                    </span>
                  ) : (
                    text
                  )}
                </div>
                {/* Mock Engagement Bar */}
                <div className="flex items-center gap-lg mt-md text-on-surface-variant opacity-60">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    <span className="text-label-sm">0</span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">repeat</span>
                    <span className="text-label-sm">0</span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                    <span className="text-label-sm">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-md bg-surface-container-low rounded-lg p-md text-body-sm font-body-sm text-on-surface-variant border border-surface-variant">
            <span className="font-bold">プロのヒント:</span> Blueskyの投稿は300文字に制限されています。
          </div>
        </div>
      </div>
    </div>
  );
}

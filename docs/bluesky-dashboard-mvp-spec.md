# Bluesky予約投稿ダッシュボード MVP仕様書

## 1. 概要

### アプリ名（仮）

**BlueQueue**

### 目的

Blueskyに対して、ブラウザ上の管理画面から以下をできるようにする。

- 投稿文を作成する
- 投稿日時を指定して予約する
- 複数投稿を一括登録する
- 指定時間になったら自動投稿する
- 投稿済み・失敗・予約中を一覧で管理する

### 基本方針

Bluesky側に予約投稿機能があるわけではなく、アプリ側で予約キューを持つ。

```text
投稿作成
  ↓
DBに予約投稿として保存
  ↓
cron / 定期実行処理
  ↓
指定時間になった投稿を検出
  ↓
Bluesky APIで投稿
  ↓
投稿済みに変更
```

---

## 2. MVPの対象範囲

### MVPで作る機能

- 管理画面ログイン
- Blueskyアカウント登録
- 1件投稿作成
- 予約投稿
- 即時投稿
- 投稿一覧
- ステータス管理
- 一括投稿登録
- 予約投稿の自動実行
- 投稿失敗時のログ保存
- 失敗投稿の再投稿

### MVPでは作らない機能

- 画像投稿
- 動画投稿
- 引用投稿
- 返信投稿
- スレッド投稿
- AI投稿生成
- 投稿分析
- いいね数・リポスト数取得
- 複数ユーザー管理
- OAuthログイン
- スマホアプリ化

---

## 3. 技術スタック

### 推奨構成

| 項目 | 技術 |
|---|---|
| フロントエンド | Next.js |
| バックエンド | Next.js Route Handler / Server Actions |
| UI | Tailwind CSS + shadcn/ui |
| DB | Supabase PostgreSQL |
| 定期実行 | Vercel Cron |
| Bluesky連携 | @atproto/api |
| デプロイ | Vercel |

### 補足

Vercel上でNext.jsアプリを動かし、DBはSupabaseに置く。  
予約投稿の実行はVercel Cronで5分ごとにAPI Routeを叩く。

---

## 4. 画面構成

```text
/login
/dashboard
/posts/new
/posts/bulk
/posts
/settings
```

---

## 5. 画面仕様

## 5-1. ログイン画面 `/login`

### 目的

管理者だけがダッシュボードを使えるようにする。

### MVP仕様

最初は簡易ログインで実装する。

```text
ADMIN_ID
ADMIN_PASSWORD
```

を環境変数に保存し、ログイン成功時にセッションCookieを発行する。

### 入力項目

| 項目 | 必須 | 内容 |
|---|---:|---|
| loginId | 必須 | 管理者ID |
| password | 必須 | 管理者パスワード |

### バリデーション

- 未入力ならエラー
- 環境変数と一致しなければエラー

---

## 5-2. ダッシュボード `/dashboard`

### 目的

現在の投稿状態をひと目で確認する。

### 表示内容

- 予約中投稿数
- 本日投稿予定数
- 投稿済み数
- 失敗投稿数
- 直近の予約投稿5件
- 直近の失敗投稿5件

### UIイメージ

```text
[予約中 12件] [本日予定 3件] [投稿済み 48件] [失敗 1件]

直近の予約投稿
--------------------------------
09:00  今日の一言...
12:00  LoL初心者向け...
18:00  倫理学メモ...
```

---

## 5-3. 新規投稿作成 `/posts/new`

### 目的

1件の投稿を作成し、即時投稿または予約保存する。

### 入力項目

| 項目 | 必須 | 内容 |
|---|---:|---|
| text | 必須 | 投稿本文 |
| scheduledAt | 任意 | 予約日時 |
| status | 自動 | draft / scheduled / posted |
| accountId | 必須 | 投稿先アカウント |

### ボタン

- 下書き保存
- 予約する
- 今すぐ投稿

### バリデーション

- 本文なし → 保存不可
- 301文字以上 → 警告
- 予約日時が過去 → 予約不可

### 投稿ステータス

```text
draft      下書き
scheduled  予約中
posting    投稿処理中
posted     投稿済み
failed     投稿失敗
```

---

## 5-4. 一括投稿登録 `/posts/bulk`

### 目的

複数の投稿文をまとめて予約登録する。

### 入力方式

MVPでは、CSVアップロードではなく **textareaの1行1投稿** で実装する。

```text
今日はBluesky自動投稿ダッシュボードを作る
予約投稿はDBとcronで管理する
一括投稿は1行1投稿にすると使いやすい
```

### 入力項目

| 項目 | 必須 | 内容 |
|---|---:|---|
| bulkText | 必須 | 1行1投稿のテキスト |
| startAt | 必須 | 最初の投稿日時 |
| intervalMinutes | 必須 | 投稿間隔 |
| accountId | 必須 | 投稿先アカウント |

### 投稿間隔の選択肢

MVPでは `intervalMinutes` の数値入力だけでよい。

例：

```text
開始日時：2026-06-03 09:00
投稿間隔：60分
```

登録結果：

```text
1件目 → 2026-06-03 09:00
2件目 → 2026-06-03 10:00
3件目 → 2026-06-03 11:00
```

### バリデーション

- 空行は無視
- 300文字超えは登録前に警告
- 同一本文が複数ある場合は警告
- 開始日時が過去なら不可
- 投稿間隔が5分未満なら不可

### 安全制限

- 一括登録は最大100件まで
- 最短投稿間隔は5分以上
- 同時刻に複数投稿しない

### 登録前プレビュー

一括登録前に、投稿予定時刻と本文を確認できるようにする。

```text
1. 2026-06-03 09:00 投稿1
2. 2026-06-03 10:00 投稿2
3. 2026-06-03 11:00 投稿3
```

---

## 5-5. 投稿一覧 `/posts`

### 目的

投稿の状態を一覧で管理する。

### タブ

- すべて
- 下書き
- 予約中
- 投稿済み
- 失敗

### 一覧項目

| 表示 | 内容 |
|---|---|
| 本文 | 投稿文の先頭80文字 |
| ステータス | draft / scheduled / posted / failed |
| 予約日時 | scheduledAt |
| 投稿完了日時 | postedAt |
| エラー | errorMessage |
| 操作 | 編集 / 削除 / 再投稿 |

### 操作仕様

#### 下書き

- 編集
- 予約する
- 削除

#### 予約中

- 編集
- 予約解除
- 削除
- 今すぐ投稿

#### 投稿済み

- Blueskyで開く
- 複製して新規作成

#### 失敗

- エラー確認
- 再投稿
- 編集
- 削除

---

## 5-6. 設定画面 `/settings`

### 目的

Blueskyアカウント情報を登録する。

### 入力項目

| 項目 | 必須 | 内容 |
|---|---:|---|
| handle | 必須 | 例：example.bsky.social |
| appPassword | 必須 | Blueskyアプリパスワード |
| displayName | 任意 | 管理画面上の表示名 |

### 注意

通常のBlueskyログインパスワードではなく、**アプリパスワード**を使う。

---

## 6. データベース設計

## 6-1. accounts テーブル

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  app_password_encrypted text not null,
  display_name text,
  did text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### 役割

Bluesky投稿先アカウントを保存する。

### 補足

MVPでは1アカウントだけでもよい。  
ただし、将来的な複数アカウント対応のために `accounts` テーブルは分けておく。

---

## 6-2. posts テーブル

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  text text not null,
  status text not null default 'draft',
  scheduled_at timestamp with time zone,
  posted_at timestamp with time zone,
  bluesky_uri text,
  bluesky_cid text,
  error_message text,
  retry_count integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### status 値

```text
draft
scheduled
posting
posted
failed
```

---

## 6-3. post_logs テーブル

```sql
create table post_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  action text not null,
  message text,
  created_at timestamp with time zone default now()
);
```

### action 値

```text
created
scheduled
posting
posted
failed
retry
deleted
```

### 役割

投稿処理の履歴を残す。  
失敗原因の確認に使う。

---

## 7. API設計

## 7-1. 認証系

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## 7-2. 投稿系

```text
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PATCH  /api/posts/:id
DELETE /api/posts/:id
```

---

## 7-3. 一括投稿

```text
POST /api/posts/bulk
```

### リクエスト例

```json
{
  "accountId": "uuid",
  "bulkText": "投稿1\n投稿2\n投稿3",
  "startAt": "2026-06-03T09:00:00+09:00",
  "intervalMinutes": 60
}
```

### 処理

```text
1. bulkTextを改行で分割
2. 空行を除去
3. 各行を投稿文として扱う
4. startAt + intervalMinutesでscheduledAtを生成
5. postsテーブルにscheduledで保存
```

---

## 7-4. 即時投稿

```text
POST /api/posts/:id/publish
```

### 処理

```text
1. postを取得
2. accountを取得
3. Blueskyにログイン
4. 投稿APIを実行
5. 成功ならpostedに変更
6. 失敗ならfailedに変更
```

---

## 7-5. 予約投稿実行

```text
GET /api/cron/publish-scheduled
```

### 実行タイミング

Vercel Cronで5分ごと。

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 処理

```text
1. 現在時刻以前のscheduled投稿を取得
2. statusをpostingに変更
3. Blueskyに投稿
4. 成功ならpostedに変更
5. 失敗ならfailedに変更
6. post_logsに記録
```

---

## 8. Bluesky投稿処理仕様

### 基本投稿データ

```json
{
  "$type": "app.bsky.feed.post",
  "text": "Hello World!",
  "createdAt": "2026-06-02T12:00:00.000Z"
}
```

### 投稿処理の流れ

```text
1. BskyAgentを作成
2. handle + appPasswordでlogin
3. agent.post({ text })
4. 返ってきたuri/cidをpostsに保存
```

### 成功時に保存するもの

```text
bluesky_uri
bluesky_cid
posted_at
status = posted
```

### 失敗時に保存するもの

```text
status = failed
error_message
retry_count + 1
```

---

## 9. エラーハンドリング

### 想定される失敗

- アプリパスワードが間違っている
- Bluesky APIが一時的に失敗
- 投稿文が長すぎる
- ネットワークエラー
- 同じ投稿を短時間に連投
- cron実行時にDB接続失敗

### 失敗時の処理

```text
status = failed
error_message に保存
post_logs に記録
retry_count + 1
```

### 自動リトライ

MVPでは慎重にする。

```text
自動リトライは最大3回
リトライ間隔は最低10分
同じ投稿を連続投稿しない
```

---

## 10. セキュリティ仕様

### 必須対応

- appPasswordは平文保存しない
- 管理画面はログイン必須
- cron APIには認証キーをつける
- `.env` をGitHubに上げない

### 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_ID=
ADMIN_PASSWORD=

APP_ENCRYPTION_KEY=
CRON_SECRET=
```

### cron API保護

例：

```text
/api/cron/publish-scheduled?secret=xxxx
```

またはHeaderで保護する。

```text
Authorization: Bearer CRON_SECRET
```

---

## 11. ファイル構成案

```text
src/
  app/
    login/
      page.tsx
    dashboard/
      page.tsx
    posts/
      page.tsx
      new/
        page.tsx
      bulk/
        page.tsx
    settings/
      page.tsx
    api/
      auth/
        login/
          route.ts
        logout/
          route.ts
      posts/
        route.ts
        [id]/
          route.ts
          publish/
            route.ts
        bulk/
          route.ts
      cron/
        publish-scheduled/
          route.ts

  components/
    layout/
      Header.tsx
      Sidebar.tsx
    posts/
      PostForm.tsx
      PostList.tsx
      BulkPostForm.tsx
      StatusBadge.tsx

  lib/
    supabase.ts
    bluesky.ts
    auth.ts
    encryption.ts
    validators.ts

  types/
    post.ts
    account.ts
```

---

## 12. 主要コンポーネント仕様

## 12-1. PostForm

### 役割

1件投稿の作成・編集。

### props

```ts
type PostFormProps = {
  initialText?: string;
  initialScheduledAt?: string;
  mode: "create" | "edit";
};
```

### 機能

- 本文入力
- 文字数表示
- 予約日時入力
- 下書き保存
- 予約保存
- 今すぐ投稿

---

## 12-2. BulkPostForm

### 役割

複数投稿を一括作成。

### 機能

- 1行1投稿入力
- 開始日時選択
- 投稿間隔選択
- 登録前プレビュー
- 一括登録

### プレビュー表示

```text
1. 2026-06-03 09:00 投稿1
2. 2026-06-03 10:00 投稿2
3. 2026-06-03 11:00 投稿3
```

---

## 12-3. PostList

### 役割

投稿一覧表示。

### 機能

- ステータス別フィルター
- 本文検索
- 編集
- 削除
- 再投稿
- Blueskyで開く

MVPでは検索は後回しでもよい。

---

## 13. 開発順序

## Step 1：プロジェクト作成

```bash
npx create-next-app@latest bluesky-dashboard
```

選択例：

```text
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
App Router: Yes
src directory: Yes
```

---

## Step 2：Supabase作成

作るテーブル。

```text
accounts
posts
post_logs
```

---

## Step 3：画面だけ作る

最初はDB接続なしで、静的画面として以下を作る。

```text
/dashboard
/posts/new
/posts/bulk
/posts
/settings
```

---

## Step 4：DB接続

以下を実装する。

- 投稿作成
- 投稿一覧
- 投稿編集
- 投稿削除

---

## Step 5：Bluesky投稿テスト

まずはローカルで1件投稿できるようにする。

```text
handle
appPassword
text
```

を使って投稿成功を確認する。

---

## Step 6：予約投稿処理

以下の条件で投稿対象を取得する。

```text
scheduled_at <= 現在時刻
status = scheduled
```

取得した投稿をBlueskyに投稿する。

---

## Step 7：Vercel Cron

5分ごとに予約投稿処理を実行する。

---

## Step 8：一括投稿

textareaから複数投稿を登録する。

---

## 14. MVP完成条件

以下ができたらMVP完成。

- 管理画面にログインできる
- Blueskyアカウント情報を保存できる
- 投稿文を1件作成できる
- 投稿を予約できる
- 予約投稿が時間になったら自動投稿される
- 一括投稿を登録できる
- 投稿一覧で状態を確認できる
- 失敗時にエラー内容が見える
- 失敗投稿を再投稿できる

---

## 15. 優先度

### MVP必須

- ログイン
- アカウント設定
- 投稿作成
- 予約投稿
- 投稿一覧
- 一括投稿
- cron自動投稿
- 失敗ログ
- 再投稿

### MVP後でOK

- 画像投稿
- AI投稿生成
- カレンダーUI
- CSVインポート
- 複数アカウント切り替え
- 投稿テンプレ
- 分析
- スマホ最適化

---

## 16. 最小MVP案

さらに削るなら、最初はこれだけでもよい。

```text
1. settingsでBlueskyアカウント登録
2. posts/newで投稿予約
3. postsで一覧確認
4. cronで自動投稿
```

ただし、このアプリの価値は一括投稿にあるため、MVPには一括投稿を含める。

---

## 17. 今後の拡張案

### AI投稿生成

ChatGPTやGemini APIを使って、投稿文の下書きを生成する。

想定用途：

- 対話ログから一言投稿を生成
- LoLブログ記事から告知投稿を生成
- 哲学・倫理学メモを短文化
- 商品紹介投稿を作成

### カレンダーUI

予約投稿をカレンダー形式で表示する。

### CSVインポート

以下の形式でCSV登録できるようにする。

```csv
text,scheduled_at
投稿1,2026-06-03 09:00
投稿2,2026-06-03 10:00
```

### 複数アカウント対応

用途別にアカウントを分ける。

- LoL用
- 対話ログ用
- 教育系用
- 商品紹介用

---

## 18. このアプリの運用イメージ

```text
ChatGPTで投稿文をまとめて作る
↓
一括投稿ページに貼る
↓
1時間ごと・1日ごとに予約登録
↓
Blueskyに自動投稿
```

### 想定用途

- LoL用投稿
- 対話ログ一言投稿
- 哲学・倫理学系投稿
- ブログ更新通知
- 商品紹介投稿

---

## 19. 開発チケット例

### 初期セットアップ

- [ ] Next.jsプロジェクト作成
- [ ] Tailwind CSS確認
- [ ] shadcn/ui導入
- [ ] Supabaseプロジェクト作成
- [ ] 環境変数設定

### DB

- [ ] accountsテーブル作成
- [ ] postsテーブル作成
- [ ] post_logsテーブル作成
- [ ] Supabase接続処理作成

### 認証

- [ ] ログイン画面作成
- [ ] ログインAPI作成
- [ ] セッションCookie作成
- [ ] ログアウトAPI作成
- [ ] 未ログイン時のリダイレクト

### 設定

- [ ] Blueskyアカウント設定画面作成
- [ ] appPassword暗号化処理作成
- [ ] アカウント保存API作成

### 投稿作成

- [ ] PostForm作成
- [ ] 文字数カウント
- [ ] 下書き保存
- [ ] 予約保存
- [ ] 即時投稿

### 投稿一覧

- [ ] PostList作成
- [ ] ステータス表示
- [ ] タブ切り替え
- [ ] 編集
- [ ] 削除
- [ ] 再投稿

### 一括投稿

- [ ] BulkPostForm作成
- [ ] 改行分割処理
- [ ] 開始日時指定
- [ ] 投稿間隔指定
- [ ] 登録前プレビュー
- [ ] 一括登録API作成

### Bluesky連携

- [ ] @atproto/api導入
- [ ] ログイン処理作成
- [ ] 投稿処理作成
- [ ] 成功時のuri/cid保存
- [ ] 失敗時のエラー保存

### Cron

- [ ] publish-scheduled API作成
- [ ] CRON_SECRETチェック
- [ ] 予約投稿取得
- [ ] 投稿処理
- [ ] Vercel Cron設定
- [ ] 失敗ログ保存

---

## 20. 備考

このMVPは、単なるBluesky予約投稿ツールではなく、将来的に以下へ拡張できる。

- SNS投稿OS
- AI投稿生成ダッシュボード
- ブログ告知自動化ツール
- 個人メディア運用ツール
- 複数SNS管理ツール

最初の目的は、Blueskyに限定して「予約投稿」と「一括投稿」を安定して動かすこと。

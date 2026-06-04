import { Account, Post, PostLog, DatabaseInterface } from './types';

const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL || '';
const GAS_API_TOKEN = process.env.GAS_API_TOKEN || 'your_gas_api_token_secret_here';

// Helper for making requests to GAS Webapp
async function fetchFromGas(action: string, params: Record<string, string> = {}): Promise<any> {
  if (!GAS_WEBAPP_URL) {
    throw new Error('GAS_WEBAPP_URL environment variable is not defined');
  }

  const queryParams = new URLSearchParams({
    token: GAS_API_TOKEN,
    action,
    ...params,
  });

  const url = `${GAS_WEBAPP_URL}?${queryParams.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    // Prevent Next.js from caching these dynamic DB requests
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GAS API GET error: ${res.statusText}`);
  }

  const result = await res.json();
  if (!result.success) {
    throw new Error(`GAS API error: ${result.error}`);
  }

  return result.data;
}

async function postToGas(sheet: 'posts' | 'accounts' | 'logs', action: 'save' | 'delete', payload: Record<string, any>): Promise<any> {
  if (!GAS_WEBAPP_URL) {
    throw new Error('GAS_WEBAPP_URL environment variable is not defined');
  }

  const body = {
    token: GAS_API_TOKEN,
    action,
    sheet,
    ...payload,
  };

  const res = await fetch(GAS_WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`GAS API POST error: ${res.statusText}`);
  }

  const result = await res.json();
  if (!result.success) {
    throw new Error(`GAS API error: ${result.error}`);
  }

  return result;
}

// Data parser to convert Sheet string values back to proper JS types
function sanitizeAccount(acc: any): Account {
  return {
    id: String(acc.id),
    platform: String(acc.platform || 'bluesky'),
    display_name: acc.display_name ? String(acc.display_name) : undefined,
    handle: String(acc.handle),
    app_password_encrypted: String(acc.app_password_encrypted),
    is_active: acc.is_active === true || acc.is_active === 'TRUE',
    did: acc.did ? String(acc.did) : undefined,
    created_at: acc.created_at ? String(acc.created_at) : undefined,
    updated_at: acc.updated_at ? String(acc.updated_at) : undefined,
  };
}

function sanitizePost(post: any): Post {
  let status = post.status;
  if (status === 'approved') status = 'scheduled';
  if (status === 'processing') status = 'posting';

  return {
    id: String(post.id),
    account_id: String(post.account_id),
    text: String(post.text),
    status: status as Post['status'],
    scheduled_at: post.scheduled_at ? String(post.scheduled_at) : null,
    posted_at: post.posted_at ? String(post.posted_at) : null,
    bluesky_uri: post.bluesky_uri ? String(post.bluesky_uri) : null,
    bluesky_cid: post.bluesky_cid ? String(post.bluesky_cid) : null,
    error_message: post.error_message ? String(post.error_message) : null,
    retry_count: Number(post.retry_count || 0),
    created_at: post.created_at ? String(post.created_at) : undefined,
    updated_at: post.updated_at ? String(post.updated_at) : undefined,
  };
}

function sanitizeLog(log: any): PostLog {
  return {
    id: String(log.id),
    post_id: String(log.post_id),
    action: log.action as PostLog['action'],
    message: log.message ? String(log.message) : null,
    created_at: log.created_at ? String(log.created_at) : undefined,
  };
}

export const sheetsDb: DatabaseInterface = {
  async getAccounts(): Promise<Account[]> {
    const raw = await fetchFromGas('getAccounts');
    return (raw || []).map(sanitizeAccount);
  },

  async saveAccount(account: Omit<Account, 'id'> & { id?: string }): Promise<Account> {
    const id = account.id || Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    const fullAccount: Account = {
      ...account,
      id,
      platform: account.platform || 'bluesky',
      created_at: account.created_at || now,
      updated_at: now,
    };

    await postToGas('accounts', 'save', { data: fullAccount });
    return fullAccount;
  },

  async deleteAccount(id: string): Promise<void> {
    await postToGas('accounts', 'delete', { id });
  },

  async getPosts(): Promise<Post[]> {
    const raw = await fetchFromGas('getPosts');
    const posts: Post[] = (raw || []).map(sanitizePost);
    // Sort descending by created_at
    return posts.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async getPostById(id: string): Promise<Post | null> {
    const posts = await this.getPosts();
    return posts.find((p) => p.id === id) || null;
  },

  async savePost(post: Omit<Post, 'id' | 'retry_count'> & { id?: string; retry_count?: number }): Promise<Post> {
    const id = post.id || Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    
    let status: string = post.status;
    if (status === 'scheduled') status = 'approved';
    if (status === 'posting') status = 'processing';

    const fullPost = {
      ...post,
      id,
      status,
      retry_count: post.retry_count || 0,
      created_at: post.created_at || now,
      updated_at: now,
    };

    await postToGas('posts', 'save', { data: fullPost });
    
    return {
      ...fullPost,
      status: post.status, // return original status to next.js caller
    } as any;
  },

  async deletePost(id: string): Promise<void> {
    await postToGas('posts', 'delete', { id });
  },

  async getPostLogs(postId?: string): Promise<PostLog[]> {
    const raw = await fetchFromGas('getLogs');
    let logs: PostLog[] = (raw || []).map(sanitizeLog);
    if (postId) {
      logs = logs.filter((l) => l.post_id === postId);
    }
    return logs.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async addPostLog(postId: string, action: PostLog['action'], message?: string | null): Promise<PostLog> {
    const id = Math.random().toString(36).substring(2, 15);
    const log: PostLog = {
      id,
      post_id: postId,
      action,
      message,
      created_at: new Date().toISOString(),
    };

    await postToGas('logs', 'save', { data: log });
    return log;
  },
};

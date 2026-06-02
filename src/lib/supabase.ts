import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Define TS Types
export interface Account {
  id: string;
  handle: string;
  app_password_encrypted: string;
  display_name?: string;
  did?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  account_id: string;
  text: string;
  status: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed';
  scheduled_at?: string | null;
  posted_at?: string | null;
  bluesky_uri?: string | null;
  bluesky_cid?: string | null;
  error_message?: string | null;
  retry_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PostLog {
  id: string;
  post_id: string;
  action: 'created' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'retry' | 'deleted';
  message?: string | null;
  created_at?: string;
}

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isSupabaseConfigured = supabaseUrl && supabaseServiceKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Mock file DB configuration
const MOCK_DB_PATH = path.join(process.cwd(), 'mock_db.json');

interface MockDBData {
  accounts: Account[];
  posts: Post[];
  post_logs: PostLog[];
}

const defaultMockData: MockDBData = {
  accounts: [
    {
      id: 'default-account-id-1',
      handle: 'alexm.bsky.social',
      app_password_encrypted: 'mock_encrypted_password_here',
      display_name: 'Alex Mercer',
      did: 'did:plc:mockdid1234567890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  posts: [
    {
      id: 'mock-post-1',
      account_id: 'default-account-id-1',
      text: "Excited to announce our new feature rollout for Q3! 🚀 We've been working hard on this one...",
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      posted_at: null,
      bluesky_uri: null,
      bluesky_cid: null,
      error_message: null,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-post-2',
      account_id: 'default-account-id-1',
      text: "A quick tutorial on how to use the new analytics dashboard to track your engagement metrics over time.",
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      posted_at: null,
      bluesky_uri: null,
      bluesky_cid: null,
      error_message: null,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-post-3',
      account_id: 'default-account-id-1',
      text: "Just testing out some new threading capabilities. Thread 1/5 🧵",
      status: 'draft',
      scheduled_at: null,
      posted_at: null,
      bluesky_uri: null,
      bluesky_cid: null,
      error_message: null,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-post-4',
      account_id: 'default-account-id-1',
      text: "Weekly wrap-up thread containing image attachments failed to process due to API timeout.",
      status: 'failed',
      scheduled_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      posted_at: null,
      bluesky_uri: null,
      bluesky_cid: null,
      error_message: "API timeout connecting to bsky.social",
      retry_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'mock-post-5',
      account_id: 'default-account-id-1',
      text: "Just published a new blog post on maximizing your social media engagement. Check it out on our website!",
      status: 'posted',
      scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      posted_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30 * 1000).toISOString(),
      bluesky_uri: "at://did:plc:mockdid1234567890/app.bsky.feed.post/mockposturi1",
      bluesky_cid: "mockcid12345",
      error_message: null,
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  post_logs: [
    {
      id: 'log-1',
      post_id: 'mock-post-4',
      action: 'failed',
      message: 'Failed to post: API timeout connecting to bsky.social',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-2',
      post_id: 'mock-post-5',
      action: 'posted',
      message: 'Successfully posted to Bluesky',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30 * 1000).toISOString(),
    }
  ]
};

function readMockDB(): MockDBData {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(defaultMockData, null, 2), 'utf-8');
      return defaultMockData;
    }
    const content = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading mock DB file:', error);
    return defaultMockData;
  }
}

function writeMockDB(data: MockDBData): void {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing mock DB file:', error);
  }
}

// Uniform database wrapper
export const db = {
  // Accounts CRUD
  async getAccounts(): Promise<Account[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw error;
      return data || [];
    } else {
      const data = readMockDB();
      return data.accounts;
    }
  },

  async saveAccount(account: Omit<Account, 'id'> & { id?: string }): Promise<Account> {
    const id = account.id || Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    const fullAccount: Account = {
      ...account,
      id,
      created_at: account.created_at || now,
      updated_at: now
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('accounts')
        .upsert(fullAccount)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const data = readMockDB();
      const index = data.accounts.findIndex(a => a.id === id);
      if (index > -1) {
        data.accounts[index] = fullAccount;
      } else {
        data.accounts.push(fullAccount);
      }
      writeMockDB(data);
      return fullAccount;
    }
  },

  async deleteAccount(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    } else {
      const data = readMockDB();
      data.accounts = data.accounts.filter(a => a.id !== id);
      // Cascade delete posts
      data.posts = data.posts.filter(p => p.account_id !== id);
      writeMockDB(data);
    }
  },

  // Posts CRUD
  async getPosts(): Promise<Post[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const data = readMockDB();
      return [...data.posts].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }
  },

  async getPostById(id: string): Promise<Post | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    } else {
      const data = readMockDB();
      return data.posts.find(p => p.id === id) || null;
    }
  },

  async savePost(post: Omit<Post, 'id' | 'retry_count'> & { id?: string; retry_count?: number }): Promise<Post> {
    const id = post.id || Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    const fullPost: Post = {
      ...post,
      id,
      retry_count: post.retry_count || 0,
      created_at: post.created_at || now,
      updated_at: now
    } as Post;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('posts')
        .upsert(fullPost)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const data = readMockDB();
      const index = data.posts.findIndex(p => p.id === id);
      if (index > -1) {
        data.posts[index] = fullPost;
      } else {
        data.posts.push(fullPost);
      }
      writeMockDB(data);
      return fullPost;
    }
  },

  async deletePost(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    } else {
      const data = readMockDB();
      data.posts = data.posts.filter(p => p.id !== id);
      // Cascade delete logs
      data.post_logs = data.post_logs.filter(l => l.post_id !== id);
      writeMockDB(data);
    }
  },

  // Post Logs CRUD
  async getPostLogs(postId?: string): Promise<PostLog[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('post_logs').select('*');
      if (postId) {
        query = query.eq('post_id', postId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const data = readMockDB();
      let logs = data.post_logs;
      if (postId) {
        logs = logs.filter(l => l.post_id === postId);
      }
      return [...logs].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }
  },

  async addPostLog(postId: string, action: PostLog['action'], message?: string | null): Promise<PostLog> {
    const id = Math.random().toString(36).substring(2, 15);
    const log: PostLog = {
      id,
      post_id: postId,
      action,
      message,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('post_logs')
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const data = readMockDB();
      data.post_logs.push(log);
      writeMockDB(data);
      return log;
    }
  }
};

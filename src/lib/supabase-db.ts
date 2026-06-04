import { createClient } from '@supabase/supabase-js';
import { Account, Post, PostLog, DatabaseInterface } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isSupabaseConfigured = supabaseUrl && supabaseServiceKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const supabaseDb: DatabaseInterface = {
  async getAccounts(): Promise<Account[]> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const { data, error } = await supabase.from('accounts').select('*');
    if (error) throw error;
    return data || [];
  },

  async saveAccount(account: Omit<Account, 'id'> & { id?: string }): Promise<Account> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const id = account.id || Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    const fullAccount: Account = {
      ...account,
      id,
      platform: account.platform || 'bluesky',
      created_at: account.created_at || now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('accounts')
      .upsert(fullAccount)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAccount(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },

  async getPosts(): Promise<Post[]> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPostById(id: string): Promise<Post | null> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async savePost(post: Omit<Post, 'id' | 'retry_count'> & { id?: string; retry_count?: number }): Promise<Post> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const id = post.id || Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    const fullPost: Post = {
      ...post,
      id,
      retry_count: post.retry_count || 0,
      created_at: post.created_at || now,
      updated_at: now
    } as Post;

    const { data, error } = await supabase
      .from('posts')
      .upsert(fullPost)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePost(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  },

  async getPostLogs(postId?: string): Promise<PostLog[]> {
    if (!supabase) throw new Error('Supabase client is not configured');
    let query = supabase.from('post_logs').select('*');
    if (postId) {
      query = query.eq('post_id', postId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addPostLog(postId: string, action: PostLog['action'], message?: string | null): Promise<PostLog> {
    if (!supabase) throw new Error('Supabase client is not configured');
    const id = Math.random().toString(36).substring(2, 15);
    const log: PostLog = {
      id,
      post_id: postId,
      action,
      message,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('post_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

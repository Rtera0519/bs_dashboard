export interface Account {
  id: string;
  platform?: string;
  display_name?: string;
  handle: string;
  app_password_encrypted: string;
  is_active?: boolean;
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

export interface DatabaseInterface {
  getAccounts(): Promise<Account[]>;
  saveAccount(account: Omit<Account, 'id'> & { id?: string }): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  
  getPosts(): Promise<Post[]>;
  getPostById(id: string): Promise<Post | null>;
  savePost(post: Omit<Post, 'id' | 'retry_count'> & { id?: string; retry_count?: number }): Promise<Post>;
  deletePost(id: string): Promise<void>;
  
  getPostLogs(postId?: string): Promise<PostLog[]>;
  addPostLog(postId: string, action: PostLog['action'], message?: string | null): Promise<PostLog>;
}

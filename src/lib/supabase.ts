// Re-export types for backward compatibility
export type { Account, Post, PostLog, DatabaseInterface } from './types';

// Re-export db from selector for backward compatibility
export { db } from './db';

// Re-export raw supabase client if needed
export { supabase } from './supabase-db';

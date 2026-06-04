import { DatabaseInterface } from './types';
import { localDb } from './local-db';
import { supabaseDb } from './supabase-db';
import { sheetsDb } from './sheets';

const dbType = process.env.DB_TYPE || 'local';

export const db: DatabaseInterface = (() => {
  if (dbType === 'sheets') {
    console.log('[Database] Using Google Sheets DB driver');
    return sheetsDb;
  }
  
  if (dbType === 'supabase') {
    console.log('[Database] Using Supabase DB driver');
    return supabaseDb;
  }
  
  console.log('[Database] Using Local JSON File DB driver');
  return localDb;
})();

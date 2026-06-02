import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { decrypt } from '@/lib/encryption';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing account id' }, { status: 400 });
    }

    const accounts = await db.getAccounts();
    const account = accounts.find((a) => a.id === id);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const decryptedPassword = decrypt(account.app_password_encrypted);
    return NextResponse.json({ decryptedPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

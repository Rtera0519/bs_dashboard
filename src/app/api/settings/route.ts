import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { encrypt } from '@/lib/encryption';
import { isAuthenticated } from '@/lib/auth';
import { verifyCredentials } from '@/lib/bluesky';

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, handle, appPassword, displayName } = await req.json();

    if (!handle || !appPassword) {
      return NextResponse.json({ error: 'Missing handle or appPassword' }, { status: 400 });
    }

    // Verify credentials first to be safe
    const verifyRes = await verifyCredentials(handle, appPassword);
    if (!verifyRes.success) {
      return NextResponse.json({ error: `Bluesky Connection Error: ${verifyRes.error}` }, { status: 400 });
    }

    const appPasswordEncrypted = encrypt(appPassword);

    const account = await db.saveAccount({
      id,
      handle,
      app_password_encrypted: appPasswordEncrypted,
      display_name: displayName || verifyRes.displayName || '',
      did: verifyRes.did || '',
    });

    return NextResponse.json(account);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

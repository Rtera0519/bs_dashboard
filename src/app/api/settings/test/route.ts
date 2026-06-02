import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/bluesky';
import { isAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { handle, appPassword } = await req.json();
    if (!handle || !appPassword) {
      return NextResponse.json({ error: 'Missing handle or password' }, { status: 400 });
    }

    const result = await verifyCredentials(handle, appPassword);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

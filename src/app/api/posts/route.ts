import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const posts = await db.getPosts();
    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { accountId, text, status, scheduledAt } = await req.json();

    if (!accountId || !text) {
      return NextResponse.json({ error: 'Missing accountId or text' }, { status: 400 });
    }

    const post = await db.savePost({
      account_id: accountId,
      text,
      status: status || 'draft',
      scheduled_at: scheduledAt || null,
      retry_count: 0,
    });

    // Log the action
    const logAction = status === 'scheduled' ? 'scheduled' : 'created';
    await db.addPostLog(post.id, logAction, `Post was successfully created with status: ${status}`);

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

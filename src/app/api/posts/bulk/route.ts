import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { accountId, bulkText, startAt, intervalMinutes } = await req.json();

    if (!accountId || !bulkText || !startAt || !intervalMinutes) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const lines = bulkText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    if (lines.length === 0) {
      return NextResponse.json({ error: 'No posts found in text body' }, { status: 400 });
    }

    const startDateTime = new Date(startAt).getTime();
    if (isNaN(startDateTime)) {
      return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
    }

    const createdPosts = [];

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (lineText.length > 300) {
        return NextResponse.json(
          { error: `Line ${i + 1} exceeds 300 characters. Save aborted.` },
          { status: 400 }
        );
      }

      const postScheduledTime = new Date(startDateTime + i * intervalMinutes * 60 * 1000).toISOString();

      const post = await db.savePost({
        account_id: accountId,
        text: lineText,
        status: 'scheduled',
        scheduled_at: postScheduledTime,
        retry_count: 0,
      });

      await db.addPostLog(post.id, 'scheduled', `Post bulk-scheduled for: ${postScheduledTime}`);
      createdPosts.push(post);
    }

    return NextResponse.json({ success: true, count: createdPosts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

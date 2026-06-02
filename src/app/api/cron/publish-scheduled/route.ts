import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { decrypt } from '@/lib/encryption';
import { publishPost } from '@/lib/bluesky';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Check CRON_SECRET authentication
  const CRON_SECRET = process.env.CRON_SECRET || 'sk_cron_9a8b7c6d5e4f3g2h1';
  
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get('secret');

  if (authHeader !== CRON_SECRET && secretParam !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
  }

  try {
    const posts = await db.getPosts();
    const accounts = await db.getAccounts();

    // Identify posts that are due
    const now = Date.now();
    const duePosts = posts.filter(
      (p) => p.status === 'scheduled' && p.scheduled_at && new Date(p.scheduled_at).getTime() <= now
    );

    if (duePosts.length === 0) {
      return NextResponse.json({ message: 'No scheduled posts due at this time', processed: 0 });
    }

    let successCount = 0;
    let failedCount = 0;
    let retriedCount = 0;

    for (const post of duePosts) {
      const account = accounts.find((a) => a.id === post.account_id);
      if (!account) {
        // Mark as failed directly
        await db.savePost({
          ...post,
          status: 'failed',
          error_message: 'Account not found for schedule',
        });
        await db.addPostLog(post.id, 'failed', 'Account associated with the post was not found.');
        failedCount++;
        continue;
      }

      // Mark status as posting
      await db.savePost({
        ...post,
        status: 'posting',
      });
      await db.addPostLog(post.id, 'posting', 'Cron trigger: connecting to Bluesky...');

      const decryptedPassword = decrypt(account.app_password_encrypted);

      // Attempt publication
      const result = await publishPost(account.handle, decryptedPassword, post.text);

      if (result.success && result.uri && result.cid) {
        await db.savePost({
          ...post,
          status: 'posted',
          posted_at: new Date().toISOString(),
          bluesky_uri: result.uri,
          bluesky_cid: result.cid,
          error_message: null,
        });
        await db.addPostLog(post.id, 'posted', 'Successfully posted via Vercel Cron.');
        successCount++;
      } else {
        const errorMessage = result.error || 'Connection error';
        const nextRetryCount = post.retry_count + 1;

        if (nextRetryCount < 3) {
          // Automatic retry: reschedule 10 minutes in the future
          const retryTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          await db.savePost({
            ...post,
            status: 'scheduled', // Keep scheduled status
            scheduled_at: retryTime,
            error_message: `${errorMessage} (Retry ${nextRetryCount} pending)`,
            retry_count: nextRetryCount,
          });
          await db.addPostLog(
            post.id,
            'retry',
            `Failed: ${errorMessage}. Scheduled automatic retry ${nextRetryCount}/3 for ${retryTime}.`
          );
          retriedCount++;
        } else {
          // Exceeded retries, mark as failed
          await db.savePost({
            ...post,
            status: 'failed',
            error_message: `${errorMessage} (Max retries exceeded)`,
            retry_count: nextRetryCount,
          });
          await db.addPostLog(post.id, 'failed', `Failed: ${errorMessage}. Exceeded max retries (3/3).`);
          failedCount++;
        }
      }
    }

    return NextResponse.json({
      message: 'Cron execution completed',
      processed: duePosts.length,
      success: successCount,
      failed: failedCount,
      retried: retriedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

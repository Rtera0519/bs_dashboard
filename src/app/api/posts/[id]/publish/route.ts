import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { decrypt } from '@/lib/encryption';
import { publishPost } from '@/lib/bluesky';
import { isAuthenticated } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const post = await db.getPostById(id);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Retrieve account
  const accounts = await db.getAccounts();
  const account = accounts.find((a) => a.id === post.account_id);
  if (!account) {
    return NextResponse.json({ error: 'Account not found for post' }, { status: 404 });
  }

  // Update status to posting
  await db.savePost({
    ...post,
    status: 'posting',
  });
  await db.addPostLog(id, 'posting', 'Connecting to Bluesky API to publish...');

  // Decrypt app password
  const decryptedPassword = decrypt(account.app_password_encrypted);

  // Publish to Bluesky
  const result = await publishPost(account.handle, decryptedPassword, post.text);

  if (result.success && result.uri && result.cid) {
    const updatedPost = await db.savePost({
      ...post,
      status: 'posted',
      posted_at: new Date().toISOString(),
      bluesky_uri: result.uri,
      bluesky_cid: result.cid,
      error_message: null,
    });
    
    await db.addPostLog(id, 'posted', `Successfully published to Bluesky. URI: ${result.uri}`);
    return NextResponse.json({ success: true, post: updatedPost });
  } else {
    const errorMessage = result.error || 'Unknown error occurred during publishing';
    const updatedPost = await db.savePost({
      ...post,
      status: 'failed',
      error_message: errorMessage,
      retry_count: post.retry_count + 1,
    });

    await db.addPostLog(id, 'failed', `Failed to publish: ${errorMessage}`);
    return NextResponse.json(
      { error: errorMessage, post: updatedPost },
      { status: 500 }
    );
  }
}

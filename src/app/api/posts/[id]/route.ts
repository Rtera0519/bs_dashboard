import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const existingPost = await db.getPostById(id);

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Merge changes
    const updatedPost = await db.savePost({
      ...existingPost,
      ...body,
      // Ensure ID doesn't change
      id,
      updated_at: new Date().toISOString(),
    });

    // Log the update if status changed
    if (body.status && body.status !== existingPost.status) {
      await db.addPostLog(id, body.status, `Status changed from ${existingPost.status} to ${body.status}`);
    }

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await db.deletePost(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

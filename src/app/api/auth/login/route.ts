import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { adminId, password } = await req.json();

    const isMatch = authenticateAdmin(adminId, password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'IDまたはパスワードが正しくありません。' },
        { status: 401 }
      );
    }

    await setSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}

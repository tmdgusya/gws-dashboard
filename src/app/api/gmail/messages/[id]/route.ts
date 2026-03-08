import { NextRequest, NextResponse } from 'next/server';
import { gws } from '@/lib/gws';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'full';

  try {
    const data = await gws(['gmail', 'users', 'messages', 'get'], {
      params: { userId: 'me', id, format }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const data = await gws(['gmail', 'users', 'messages', 'modify'], {
      params: { userId: 'me', id },
      json: body
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

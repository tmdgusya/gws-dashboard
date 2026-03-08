import { NextResponse } from 'next/server';
import { gws } from '@/lib/gws';

export async function GET() {
  try {
    const data = await gws(['gmail', 'users', 'labels', 'list'], {
      params: { userId: 'me' }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

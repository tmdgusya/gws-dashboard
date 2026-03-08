import { NextRequest, NextResponse } from 'next/server';
import { gws } from '@/lib/gws';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const labelIds = searchParams.get('labelIds') || 'INBOX';
  const q = searchParams.get('q') || '';
  const maxResults = searchParams.get('maxResults') || '20';
  const pageToken = searchParams.get('pageToken');

  try {
    const params: Record<string, any> = { 
      userId: 'me', 
      maxResults: parseInt(maxResults) 
    };
    if (labelIds) params.labelIds = labelIds;
    if (q) params.q = q;
    if (pageToken) params.pageToken = pageToken;

    const data = await gws(['gmail', 'users', 'messages', 'list'], { params });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

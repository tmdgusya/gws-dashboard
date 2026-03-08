import { NextRequest, NextResponse } from 'next/server';
import { gws } from '@/lib/gws';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'trashed=false';
  const pageSize = searchParams.get('pageSize') || '50';
  const pageToken = searchParams.get('pageToken');
  const fields = searchParams.get('fields') || 'files(id,name,mimeType,modifiedTime,size,webViewLink,parents,shared)';

  try {
    const params: Record<string, any> = {
      pageSize: parseInt(pageSize),
      q,
      fields: `nextPageToken,${fields}`
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await gws(['drive', 'files', 'list'], { params });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

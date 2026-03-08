import { NextRequest, NextResponse } from 'next/server';
import { gws } from '@/lib/gws';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const fields = searchParams.get('fields') || 'id,name,mimeType,modifiedTime,size,webViewLink,parents,shared';

  try {
    const data = await gws(['drive', 'files', 'get'], {
      params: { fileId: id, fields }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await gws(['drive', 'files', 'delete'], {
      params: { fileId: id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

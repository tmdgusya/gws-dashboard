import { NextRequest, NextResponse } from 'next/server';
import { gws } from '@/lib/gws';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { to, subject, body: emailBody } = body;

  if (!to || !subject || !emailBody) {
    return NextResponse.json(
      { error: 'to, subject, and body are required' },
      { status: 400 }
    );
  }

  try {
    const data = await gws(['gmail', '+send'], {
      flags: ['--to', to, '--subject', subject, '--body', emailBody]
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

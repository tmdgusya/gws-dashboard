import { NextRequest, NextResponse } from 'next/server';
import { gws } from '@/lib/gws';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get('timeMin');
  const timeMax = searchParams.get('timeMax');
  const maxResults = searchParams.get('maxResults') || '50';
  const calendarId = searchParams.get('calendarId') || 'primary';

  try {
    const params: Record<string, any> = {
      calendarId,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: parseInt(maxResults)
    };
    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const data = await gws(['calendar', 'events', 'list'], { params });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { summary, start, end, location, description, calendarId } = body;

  if (!summary || !start || !end) {
    return NextResponse.json(
      { error: 'summary, start, and end are required' },
      { status: 400 }
    );
  }

  try {
    const flags = ['--summary', summary, '--start', start, '--end', end];
    if (location) flags.push('--location', location);
    if (description) flags.push('--description', description);
    if (calendarId && calendarId !== 'primary') flags.push('--calendar', calendarId);

    const data = await gws(['calendar', '+insert'], { flags });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

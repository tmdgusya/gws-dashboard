import { NextRequest, NextResponse } from 'next/server';
import { getServices, getChildren } from '@/lib/gws-discovery';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  
  if (!path) {
    const services = getServices();
    return NextResponse.json({ services });
  } else {
    const parts = path.split('.');
    const { resources, methods } = getChildren(parts);
    return NextResponse.json({ resources, methods });
  }
}

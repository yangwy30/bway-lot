import { NextResponse } from 'next/server';
import { getShows } from '@/lib/show-data';

export async function GET() {
  try {
    const shows = await getShows();
    return NextResponse.json(shows);
  } catch (error: any) {
    console.error('[API /shows] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

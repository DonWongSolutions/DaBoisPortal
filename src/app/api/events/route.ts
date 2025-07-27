
import { NextResponse } from 'next/server';
import { getEvents as readEventsData } from '@/lib/data';

export async function GET() {
  try {
    const events = await readEventsData();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to get events:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

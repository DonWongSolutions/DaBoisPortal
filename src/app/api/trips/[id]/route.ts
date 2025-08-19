
import { NextResponse } from 'next/server';
import { getTrips as readTripsData } from '@/lib/data';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = Number(params.id);
    const trips = await readTripsData();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 });
    }
    
    return NextResponse.json(trip);
  } catch (error) {
    console.error('Failed to get trip:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

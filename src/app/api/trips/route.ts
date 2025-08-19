
import { NextResponse } from 'next/server';
import { getTrips as readTripsData } from '@/lib/data';

export async function GET() {
  try {
    const trips = await readTripsData();
    return NextResponse.json(trips);
  } catch (error) {
    console.error('Failed to get trips:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTrips, getUsers, getEvents } from '@/lib/data';
import { TripDetailsClientPage } from './trip-details-client-page';

export default async function TripDetailsPage({ params }: { params: { id: string } }) {
    const user = await getSession();
    if (!user) {
        redirect('/login');
    }

    const tripId = Number(params.id);
    const allTrips = await getTrips();
    const trip = allTrips.find(t => t.id === tripId);

    if (!trip) {
        redirect('/trips');
    }
    
    const allUsers = await getUsers();
    const allEvents = await getEvents();
    const eventExists = allEvents.some(e => e.tripId === tripId);

    return <TripDetailsClientPage user={user} trip={trip} allUsers={allUsers} eventExists={eventExists} />;
}


'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deleteSession, getSession, setSession } from '@/lib/auth';
import { getUsers, getEvents, saveEvents, getTrips, saveTrips, saveSettings } from '@/lib/data';
import type { AppSettings, Event, Trip } from '@/lib/types';

export async function loginAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;

  if (!name || !password) {
    return { message: 'Please enter both name and password.' };
  }

  const users = await getUsers();
  const user = users.find((u) => u.name === name);

  if (!user || user.password !== password) {
    return { message: 'Invalid credentials. Please try again.' };
  }

  await setSession(user.name);
  redirect('/dashboard');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}

export async function updateSettingsAction(settings: AppSettings) {
    try {
        await saveSettings(settings);
        revalidatePath('/admin');
        revalidatePath('/login');
        revalidatePath('/dashboard');
        return { success: true, message: 'Settings updated successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to update settings.' };
    }
}

export async function createEventAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        redirect('/login');
    }

    const users = await getUsers();

    const newEvent: Event = {
        id: Date.now(),
        title: formData.get('title') as string,
        date: formData.get('date') as string,
        description: formData.get('description') as string,
        isFamilyEvent: formData.get('isFamilyEvent') === 'on',
        createdBy: sessionUser.name,
        responses: users.reduce((acc, user) => {
            acc[user.name] = 'pending';
            return acc;
        }, {} as Record<string, 'yes' | 'no' | 'maybe' | 'pending'>),
    };

    const events = await getEvents();
    events.push(newEvent);
    await saveEvents(events);

    revalidatePath('/events');
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
    redirect('/events');
}

export async function createTripAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        redirect('/login');
    }

    const attendees = formData.getAll('attendees') as string[];

    const newTrip: Trip = {
        id: Date.now(),
        name: formData.get('name') as string,
        destination: formData.get('destination') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        createdBy: sessionUser.name,
        attendees: attendees,
        itinerary: [],
        costs: [],
    };
    
    const trips = await getTrips();
    trips.push(newTrip);
    await saveTrips(trips);

    revalidatePath('/trips');
    redirect('/trips');
}

export async function addItineraryItemAction(tripId: number, formData: FormData) {
    const trips = await getTrips();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
        // Handle error
        return;
    }

    const day = formData.get('day') as string;
    
    const newActivity = {
        time: formData.get('time') as string,
        description: formData.get('description') as string,
    };

    let dayItinerary = trip.itinerary.find(i => i.day === day);

    if (dayItinerary) {
        dayItinerary.activities.push(newActivity);
        dayItinerary.activities.sort((a, b) => a.time.localeCompare(b.time));
    } else {
        dayItinerary = { day, activities: [newActivity] };
        trip.itinerary.push(dayItinerary);
        trip.itinerary.sort((a,b) => new Date(a.day).getTime() - new Date(b.day).getTime());
    }

    await saveTrips(trips);
    revalidatePath(`/trips/${tripId}`);
}

export async function addCostItemAction(tripId: number, formData: FormData) {
    const trips = await getTrips();
    const trip = trips.find(t => t.id === tripId);
     if (!trip) {
        // Handle error
        return;
    }

    const newCostItem = {
        id: Date.now(),
        item: formData.get('item') as string,
        amount: parseFloat(formData.get('amount') as string),
        paidBy: formData.get('paidBy') as string,
    };

    trip.costs.push(newCostItem);
    await saveTrips(trips);
    revalidatePath(`/trips/${tripId}`);
}

export async function getSessionAction() {
  return await getSession();
}

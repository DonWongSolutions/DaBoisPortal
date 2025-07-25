
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deleteSession, getSession, setSession } from '@/lib/auth';
import { getUsers, getEvents, saveEvents, getTrips, saveTrips, saveSettings } from '@/lib/data';
import type { AppSettings, Event, Trip, UserAvailability } from '@/lib/types';
import * as ical from 'node-ical';


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

export async function updateEventAction(eventId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        redirect('/login');
    }

    const events = await getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
        // Handle error, maybe redirect with a message
        redirect('/events');
    }

    const updatedEvent: Partial<Event> = {
        title: formData.get('title') as string,
        date: formData.get('date') as string,
        description: formData.get('description') as string,
        isFamilyEvent: formData.get('isFamilyEvent') === 'on',
    };

    events[eventIndex] = { ...events[eventIndex], ...updatedEvent };
    await saveEvents(events);

    revalidatePath(`/events`);
    revalidatePath(`/events/${eventId}/edit`);
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
    redirect('/events');
}


export async function updateEventResponseAction(eventId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        redirect('/login');
    }

    const response = formData.get('response') as UserAvailability;
    const events = await getEvents();
    const event = events.find(e => e.id === eventId);

    if (event) {
        event.responses[sessionUser.name] = response;
        await saveEvents(events);
        revalidatePath('/events');
        revalidatePath('/dashboard');
        revalidatePath('/schedule');
    }
}

export async function importCalendarAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        redirect('/login');
    }

    const file = formData.get('calendarFile') as File;
    if (!file || file.size === 0) {
        // Handle no file error
        return;
    }

    const fileContent = await file.text();
    const calendarEvents = ical.parseICS(fileContent);
    
    const events = await getEvents();
    const users = await getUsers();
    const allUsersResponses = users.reduce((acc, user) => {
        acc[user.name] = 'pending';
        return acc;
    }, {} as Record<string, UserAvailability>);

    for (const key in calendarEvents) {
        if (calendarEvents.hasOwnProperty(key)) {
            const calEvent = calendarEvents[key];
            if (calEvent.type === 'VEVENT') {
                const newEvent: Event = {
                    id: Date.now() + Math.random(), // Add random to avoid collisions in loop
                    title: calEvent.summary as string,
                    date: (calEvent.start as Date).toISOString().split('T')[0],
                    description: calEvent.description as string || '',
                    isFamilyEvent: false, // Default value
                    createdBy: sessionUser.name,
                    responses: { ...allUsersResponses },
                };
                events.push(newEvent);
            }
        }
    }

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

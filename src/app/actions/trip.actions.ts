'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getTrips as getTripsData, saveTrips, getUsers, getEvents, saveEvents } from '@/lib/data';
import type { Trip, Event, UserAvailability, ItineraryActivity } from '@/lib/types';

export async function createTripAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
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
    
    const trips = await getTripsData();
    trips.push(newTrip);
    await saveTrips(trips);

    revalidatePath('/trips');
    redirect('/trips');
}

export async function getTrips() {
    return await getTripsData();
}

export async function deleteTripAction(tripId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    const trips = await getTripsData();
    const updatedTrips = trips.filter(t => t.id !== tripId);
    await saveTrips(updatedTrips);
    
    const events = await getEvents();
    const updatedEvents = events.filter(e => e.tripId !== tripId);
    await saveEvents(updatedEvents);

    revalidatePath('/trips');
    revalidatePath('/events');
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
    
    return { success: true };
}

export async function createEventFromTripAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const tripId = Number(formData.get('tripId'));
    const isFamilyEvent = formData.get('isFamilyEvent') === 'on';

    if (!tripId) {
         return { success: false, message: 'Trip ID is missing.' };
    }

    const allEvents = await getEvents();
    const existingEvent = allEvents.find(e => e.tripId === tripId);

    if(existingEvent) {
        return { success: false, message: 'An event for this trip already exists.' };
    }

    const allTrips = await getTripsData();
    const trip = allTrips.find(t => t.id === tripId);

    if (!trip) {
        return { success: false, message: 'Trip not found.' };
    }

    // You can only create an event if you are the creator or an admin
    if (trip.createdBy !== sessionUser.name && sessionUser.role !== 'admin') {
        return { success: false, message: 'You are not authorized to create an event for this trip.' };
    }

    const users = await getUsers();
    const newEvent: Event = {
        id: Date.now(),
        tripId: trip.id,
        title: trip.name,
        date: trip.startDate,
        description: `This event is for the trip to ${trip.destination}. Please RSVP.`,
        isFamilyEvent: isFamilyEvent,
        type: 'group',
        createdBy: sessionUser.name,
        responses: users.reduce((acc, user) => {
            if (user.role !== 'parent') {
                acc[user.name] = 'pending';
            }
            return acc;
        }, {} as Record<string, UserAvailability>),
    };

    allEvents.push(newEvent);
    await saveEvents(allEvents);

    revalidatePath('/events');
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
    revalidatePath(`/trips/${tripId}`);

    return { success: true, message: 'Event created successfully! Redirecting...' };
}

export async function addItineraryItemAction(tripId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
       return { success: false, message: 'Unauthorized.' };
    }
    const trips = await getTripsData();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
        return { success: false, message: 'Trip not found.' };
    }

    const day = formData.get('day') as string;
    
    const dayDate = new Date(day);
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    dayDate.setUTCHours(0,0,0,0);
    startDate.setUTCHours(0,0,0,0);
    endDate.setUTCHours(0,0,0,0);

    if (dayDate < startDate || dayDate > endDate) {
        return { success: false, message: 'Itinerary date must be within the trip date range.' };
    }
    
    const newActivity: ItineraryActivity = {
        id: Date.now(),
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        description: formData.get('description') as string,
    };

    let dayItinerary = trip.itinerary.find(i => i.day === day);

    if (dayItinerary) {
        dayItinerary.activities.push(newActivity);
        dayItinerary.activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
    } else {
        dayItinerary = { day, activities: [newActivity] };
        trip.itinerary.push(dayItinerary);
        trip.itinerary.sort((a,b) => new Date(a.day).getTime() - new Date(b.day).getTime());
    }

    await saveTrips(trips);
    revalidatePath(`/trips/${tripId}`);
    return { success: true, message: 'Itinerary item added.' };
}

export async function updateItineraryItemAction(tripId: number, activityId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
       return { success: false, message: 'Unauthorized.' };
    }
    const trips = await getTripsData();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
        return { success: false, message: 'Trip not found.' };
    }

    for (const dayItinerary of trip.itinerary) {
        const activityIndex = dayItinerary.activities.findIndex(a => a.id === activityId);
        if (activityIndex > -1) {
            dayItinerary.activities[activityIndex] = {
                ...dayItinerary.activities[activityIndex],
                startTime: formData.get('startTime') as string,
                endTime: formData.get('endTime') as string,
                description: formData.get('description') as string,
            };
            dayItinerary.activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
            await saveTrips(trips);
            revalidatePath(`/trips/${tripId}`);
            return { success: true, message: 'Itinerary item updated.' };
        }
    }
    
    return { success: false, message: 'Activity not found.' };
}

export async function deleteItineraryItemAction(tripId: number, activityId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
       return { success: false, message: 'Unauthorized.' };
    }
    const trips = await getTripsData();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
        return { success: false, message: 'Trip not found.' };
    }

    for (const dayItinerary of trip.itinerary) {
        const activityIndex = dayItinerary.activities.findIndex(a => a.id === activityId);
        if (activityIndex > -1) {
            dayItinerary.activities.splice(activityIndex, 1);
            if (dayItinerary.activities.length === 0) {
                trip.itinerary = trip.itinerary.filter(i => i.day !== dayItinerary.day);
            }
            await saveTrips(trips);
            revalidatePath(`/trips/${tripId}`);
            return { success: true, message: 'Itinerary item deleted.' };
        }
    }
    
    return { success: false, message: 'Activity not found.' };
}


export async function addCostItemAction(tripId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
       return;
    }
    const trips = await getTripsData();
    const trip = trips.find(t => t.id === tripId);
     if (!trip) {
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

export async function addTripSuggestionAction(tripId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return;
    }
    const suggestion = formData.get('suggestion') as string;
    if (!suggestion) return;

    const trips = await getTripsData();
    const trip = trips.find(t => t.id === tripId);

    if (trip) {
        if (!trip.suggestions) {
            trip.suggestions = [];
        }
        trip.suggestions.push({
            suggestedBy: sessionUser.name,
            suggestion: suggestion
        });
        await saveTrips(trips);
        revalidatePath(`/trips/${tripId}`);
    }
}

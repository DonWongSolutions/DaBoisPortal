'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getUsers, getEvents, saveEvents } from '@/lib/data';
import type { Event, UserAvailability } from '@/lib/types';
import * as ical from 'node-ical';

export async function createEventAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        redirect('/login');
    }

    const users = await getUsers();
    const eventType = sessionUser.role === 'admin' ? formData.get('eventType') : 'personal';

    const events = await getEvents();

    if (eventType === 'group') {
        const isFamilyEvent = formData.get('isFamilyEvent') === 'on';
        const newEvent: Event = {
            id: Date.now(),
            title: formData.get('title') as string,
            date: formData.get('date') as string,
            description: formData.get('description') as string,
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
        events.push(newEvent);
    } else { // personal event
        const newEvent: Event = {
            id: Date.now(),
            title: formData.get('title') as string,
            date: formData.get('date') as string,
            description: formData.get('description') as string,
            isFamilyEvent: false,
            type: 'personal',
            createdBy: sessionUser.name,
            responses: { [sessionUser.name]: 'yes' },
            isPrivate: formData.get('isPrivate') === 'on',
        };
        events.push(newEvent);
    }

    await saveEvents(events);

    revalidatePath('/events');
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
    redirect(eventType === 'group' ? '/events' : '/schedule');
}

export async function updateEventAction(eventId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) redirect('/login');

    const events = await getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) redirect('/events');

    const eventToUpdate = events[eventIndex];
    if (sessionUser.role !== 'admin' && sessionUser.name !== eventToUpdate.createdBy) {
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

export async function deleteEventAction(eventId: number) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }

    const events = await getEvents();
    const eventToDelete = events.find(e => e.id === eventId);
    
    if (!eventToDelete) {
        return { success: false, message: 'Event not found.' };
    }

    if (sessionUser.role !== 'admin' && sessionUser.name !== eventToDelete.createdBy) {
        return { success: false, message: 'You are not authorized to delete this event.' };
    }

    const updatedEvents = events.filter(e => e.id !== eventId);
    await saveEvents(updatedEvents);

    revalidatePath('/events');
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
    return { success: true, message: 'Event deleted successfully.' };
}


export async function updateEventResponseAction(eventId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        redirect('/login');
    }

    const response = formData.get('response') as UserAvailability;
    const events = await getEvents();
    const event = events.find(e => e.id === eventId);

    if (event && event.type === 'group') {
        event.responses[sessionUser.name] = response;
        await saveEvents(events);
        revalidatePath('/events');
        revalidatePath('/dashboard');
        revalidatePath('/schedule');
    }
}

export async function addEventSuggestionAction(eventId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return;
    }
    const suggestion = formData.get('suggestion') as string;
    if (!suggestion) return;

    const events = await getEvents();
    const event = events.find(e => e.id === eventId);

    if (event) {
        if (!event.suggestions) {
            event.suggestions = [];
        }
        event.suggestions.push({
            suggestedBy: sessionUser.name,
            suggestion: suggestion
        });
        await saveEvents(events);
        revalidatePath('/events');
    }
}


export async function importCalendarAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        redirect('/login');
    }

    const file = formData.get('calendarFile') as File;
    if (!file || file.size === 0) {
        return;
    }

    const fileContent = await file.text();
    const calendarEvents = ical.parseICS(fileContent);
    
    const events = await getEvents();
    const users = await getUsers();
    const allUsersResponses = users.reduce((acc, user) => {
        if (user.role !== 'parent') {
           acc[user.name] = 'pending';
        }
        return acc;
    }, {} as Record<string, UserAvailability>);

    for (const key in calendarEvents) {
        if (calendarEvents.hasOwnProperty(key)) {
            const calEvent = calendarEvents[key];
            if (calEvent.type === 'VEVENT') {
                const newEvent: Event = {
                    id: Date.now() + Math.random(),
                    title: calEvent.summary as string,
                    date: (calEvent.start as Date).toISOString().split('T')[0],
                    description: calEvent.description as string || '',
                    isFamilyEvent: false,
                    type: 'group',
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

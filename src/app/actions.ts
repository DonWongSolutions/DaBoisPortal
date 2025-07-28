
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deleteSession, getSession, setSession } from '@/lib/auth';
import { getUsers, getEvents, saveEvents, getTrips, saveTrips, saveSettings, saveUsers, getLinks, saveLinks, getChatMessages, saveChatMessages } from '@/lib/data';
import type { AppSettings, Event, Trip, UserAvailability, User, Link as LinkType, ChatMessage } from '@/lib/types';
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

function calculateAge(birthday: string): number {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export async function updateUserAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        redirect('/login');
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === sessionUser.id);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    const newPassword = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword && newPassword !== confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
    }
    
    const updatedUser: User = { ...users[userIndex] };
    updatedUser.email = formData.get('email') as string;
    updatedUser.phone = formData.get('phone') as string;
    
    if (formData.has('birthday') && formData.get('birthday')) {
        const birthday = formData.get('birthday') as string;
        updatedUser.birthday = birthday;
        updatedUser.age = calculateAge(birthday);
    }

    const profilePicUrl = formData.get('profilePictureUrl') as string | null;
    if (profilePicUrl) {
        updatedUser.profilePictureUrl = profilePicUrl;
    }


    if (newPassword) {
        updatedUser.password = newPassword;
    }
    
    users[userIndex] = updatedUser;
    await saveUsers(users);

    // Re-authenticate user with potentially new details to update the session
    await setSession(updatedUser.name);
    
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true, message: 'Profile updated successfully.' };
}

export async function adminUpdateUserAction(userId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    const updatedUser = { ...users[userIndex] };
    updatedUser.email = formData.get('email') as string;
    updatedUser.phone = formData.get('phone') as string;
    
    users[userIndex] = updatedUser;
    await saveUsers(users);
    
    revalidatePath('/admin');
    return { success: true, message: 'User updated successfully.' };
}


export async function resetPasswordAction(userId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }
    const newPassword = formData.get('password') as string;
    if (!newPassword) {
        return { success: false, message: 'Password cannot be empty.' };
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    users[userIndex].password = newPassword;
    await saveUsers(users);

    revalidatePath('/admin');
    return { success: true, message: 'Password reset successfully.' };
}


export async function updateSettingsAction(settings: AppSettings) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }
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
    
    const trips = await getTrips();
    trips.push(newTrip);
    await saveTrips(trips);

    revalidatePath('/trips');
    redirect('/trips');
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

    const allTrips = await getTrips();
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
    const trips = await getTrips();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
        return { success: false, message: 'Trip not found.' };
    }

    const day = formData.get('day') as string;
    
    // Validation
    const dayDate = new Date(day);
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    // Set hours to 0 to compare dates only
    dayDate.setUTCHours(0,0,0,0);
    startDate.setUTCHours(0,0,0,0);
    endDate.setUTCHours(0,0,0,0);

    if (dayDate < startDate || dayDate > endDate) {
        return { success: false, message: 'Itinerary date must be within the trip date range.' };
    }
    
    const newActivity = {
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

export async function addCostItemAction(tripId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
       return;
    }
    const trips = await getTrips();
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

    const trips = await getTrips();
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

export async function createLinkAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }

    try {
        const tags = (formData.get('tags') as string)
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        const newLink: LinkType = {
            id: Date.now(),
            url: formData.get('url') as string,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            tags: tags,
            createdBy: sessionUser.name,
            createdAt: new Date().toISOString(),
            ratings: [],
        };

        const links = await getLinks();
        links.push(newLink);
        await saveLinks(links);

        revalidatePath('/linkboard');
        return { success: true, message: 'Link added successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to add link.' };
    }
}

export async function updateLinkAction(linkId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }
    
    try {
        const links = await getLinks();
        const linkIndex = links.findIndex(l => l.id === linkId);
        if (linkIndex === -1) {
            return { success: false, message: 'Link not found.' };
        }
        
        const link = links[linkIndex];
        if (sessionUser.role !== 'admin' && sessionUser.name !== link.createdBy) {
            return { success: false, message: 'You are not authorized to edit this link.' };
        }
        
        const tags = (formData.get('tags') as string)
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        const updatedLink: LinkType = {
            ...link,
            url: formData.get('url') as string,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            tags: tags,
        };

        links[linkIndex] = updatedLink;
        await saveLinks(links);

        revalidatePath('/linkboard');
        return { success: true, message: 'Link updated successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to update link.' };
    }
}

export async function deleteLinkAction(linkId: number) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }
    
    try {
        const links = await getLinks();
        const linkIndex = links.findIndex(l => l.id === linkId);
        if (linkIndex === -1) {
            return { success: false, message: 'Link not found.' };
        }
        
        const link = links[linkIndex];
        if (sessionUser.role !== 'admin' && sessionUser.name !== link.createdBy) {
            return { success: false, message: 'You are not authorized to delete this link.' };
        }

        links.splice(linkIndex, 1);
        await saveLinks(links);

        revalidatePath('/linkboard');
        return { success: true, message: 'Link deleted successfully.' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to delete link.' };
    }
}

export async function rateLinkAction(linkId: number, rating: number) {
     const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }
    if (rating < 1 || rating > 5) {
        return { success: false, message: 'Invalid rating.' };
    }
    
    try {
        const links = await getLinks();
        const linkIndex = links.findIndex(l => l.id === linkId);
        if (linkIndex === -1) {
            return { success: false, message: 'Link not found.' };
        }

        const link = links[linkIndex];
        const existingRatingIndex = link.ratings.findIndex(r => r.userId === sessionUser.id);
        
        if (existingRatingIndex > -1) {
            link.ratings[existingRatingIndex].rating = rating;
        } else {
            link.ratings.push({ userId: sessionUser.id, rating });
        }
        
        await saveLinks(links);
        revalidatePath('/linkboard');
        return { success: true, message: 'Rating submitted.' };
    } catch (error) {
         console.error(error);
        return { success: false, message: 'Failed to submit rating.' };
    }
}

export async function getLinksAction() {
    return await getLinks();
}

export async function getChatMessagesAction() {
    return await getChatMessages();
}

export async function sendChatMessageAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return;
    }

    const messageText = formData.get('message') as string;
    if (!messageText.trim()) {
        return;
    }
    
    const newMessage: ChatMessage = {
        id: Date.now(),
        author: sessionUser.name,
        text: messageText,
        timestamp: new Date().toISOString(),
    };

    const messages = await getChatMessages();
    messages.push(newMessage);
    await saveChatMessages(messages);

    revalidatePath('/chat');
}

export async function exportChatAction() {
    const messages = await getChatMessages();
    return messages.map(msg => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.author}: ${msg.text}`).join('\n');
}

export async function clearChatAction() {
     const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    await saveChatMessages([]);
    revalidatePath('/chat');
    return { success: true, message: 'Chat history cleared successfully.' };
}

export async function getSessionAction() {
  return await getSession();
}

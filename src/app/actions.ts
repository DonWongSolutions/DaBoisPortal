
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { deleteSession, getSession, setSession } from '@/lib/auth';
import { getUsers, getEvents, saveEvents, getTrips as getTripsData, saveTrips, saveSettings, saveUsers, getLinks, saveLinks, getChatMessages, saveChatMessages, getMemories, saveMemories, getWiseWords as getWiseWordsData, saveWiseWords, getLocations as getLocationsData, saveLocations } from '@/lib/data';
import type { AppSettings, Event, Trip, UserAvailability, User, Link as LinkType, ChatMessage, Memory, WiseWord, Location, WiseWordCategory } from '@/lib/types';
import * as ical from 'node-ical';
import { geocode } from '@/services/geocoding';


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
  if (user.forceInfoUpdate || user.forcePasswordChange) {
      redirect('/profile');
  } else {
      redirect('/dashboard');
  }
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
        updatedUser.forceInfoUpdate = false; // Turn off flag
    }

    const profilePicUrl = formData.get('profilePictureUrl') as string | null;
    if (profilePicUrl) {
        updatedUser.profilePictureUrl = profilePicUrl;
    }


    if (newPassword) {
        updatedUser.password = newPassword;
        updatedUser.forcePasswordChange = false; // Turn off flag
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

export async function adminUpdateUserFlagsAction(userId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    users[userIndex].forceInfoUpdate = formData.get('forceInfoUpdate') === 'on';
    users[userIndex].forcePasswordChange = formData.get('forcePasswordChange') === 'on';
    
    await saveUsers(users);
    
    revalidatePath('/admin');
    return { success: true, message: 'User flags updated successfully.' };
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


export async function updateSettingsAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }
    try {
         const newSettings = {
            maintenanceMode: formData.get('maintenanceMode') === 'on',
            loginImageUrl: formData.get('loginImageUrl') as string,
            dashboardBannerUrl: formData.get('dashboardBannerUrl') as string,
        };
        await saveSettings(newSettings);
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

export async function createWiseWordAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const newWiseWord: WiseWord = {
        id: Date.now(),
        phrase: formData.get('phrase') as string,
        author: formData.get('author') as string,
        context: formData.get('context') as string | undefined,
        addedBy: sessionUser.name,
        upvotes: [],
        pinned: false,
        category: 'Common',
    };

    const wiseWords = await getWiseWordsData();
    wiseWords.push(newWiseWord);
    await saveWiseWords(wiseWords);

    revalidatePath('/hall-of-fame');
    return { success: true, message: 'Wise words immortalized!' };
}

export async function getWiseWords() {
    return await getWiseWordsData();
}

export async function deleteWiseWordAction(wiseWordId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    let wiseWords = await getWiseWordsData();
    wiseWords = wiseWords.filter(ww => ww.id !== wiseWordId);
    await saveWiseWords(wiseWords);

    revalidatePath('/hall-of-fame');
    return { success: true, message: 'Wise words removed.' };
}

export async function upvoteWiseWordAction(wiseWordId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const wiseWords = await getWiseWordsData();
    const wiseWord = wiseWords.find(ww => ww.id === wiseWordId);
    if (!wiseWord) {
        return { success: false, message: 'Wise word not found.' };
    }

    const userVoteIndex = wiseWord.upvotes.indexOf(sessionUser.id);
    if (userVoteIndex > -1) {
        // User has already upvoted, so remove their vote
        wiseWord.upvotes.splice(userVoteIndex, 1);
    } else {
        // User has not upvoted, so add their vote
        wiseWord.upvotes.push(sessionUser.id);
    }

    await saveWiseWords(wiseWords);
    revalidatePath('/hall-of-fame');
    return { success: true };
}

export async function pinWiseWordAction(wiseWordId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized.' };
    }

    const wiseWords = await getWiseWordsData();
    const wiseWordToPin = wiseWords.find(ww => ww.id === wiseWordId);
    if (!wiseWordToPin) {
        return { success: false, message: 'Wise word not found.' };
    }

    // Toggle the pinned state
    wiseWordToPin.pinned = !wiseWordToPin.pinned;

    await saveWiseWords(wiseWords);
    revalidatePath('/hall-of-fame');
    revalidatePath('/login');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function updateWiseWordCategoryAction(wiseWordId: number, category: WiseWordCategory) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }
    
    const wiseWords = await getWiseWordsData();
    const wiseWord = wiseWords.find(ww => ww.id === wiseWordId);
    if (!wiseWord) {
        return { success: false, message: 'Wise word not found.' };
    }

    wiseWord.category = category;
    await saveWiseWords(wiseWords);

    revalidatePath('/hall-of-fame');
    return { success: true, message: 'Category updated.' };
}

export async function getMemoriesAction() {
    return (await getMemories()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getMemoryByIdAction(id: number) {
    const memories = await getMemories();
    return memories.find(m => m.id === id) || null;
}


export async function createMemoryAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const imageUrls = (formData.get('imageUrls') as string)
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const newMemory: Memory = {
        id: Date.now(),
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        imageUrls: imageUrls,
        createdBy: sessionUser.name,
        comments: [],
    };

    const memories = await getMemories();
    memories.push(newMemory);
    await saveMemories(memories);

    revalidatePath('/memories');
    redirect('/memories');
}

export async function updateMemoryAction(memoryId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }
    
    const memories = await getMemories();
    const memoryIndex = memories.findIndex(m => m.id === memoryId);
    if (memoryIndex === -1) {
        return { success: false, message: 'Memory not found.' };
    }

    const memory = memories[memoryIndex];
    if (sessionUser.role !== 'admin' && sessionUser.name !== memory.createdBy) {
         return { success: false, message: 'You are not authorized to edit this memory.' };
    }
    
    const imageUrls = (formData.get('imageUrls') as string)
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const updatedMemory: Memory = {
        ...memory,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        imageUrls: imageUrls,
    };

    memories[memoryIndex] = updatedMemory;
    await saveMemories(memories);

    revalidatePath(`/memories/${memoryId}`);
    revalidatePath('/memories');
    redirect(`/memories/${memoryId}`);
}

export async function deleteMemoryAction(memoryId: number) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized.' };
    }

    const memories = await getMemories();
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) {
        return { success: false, message: 'Memory not found.' };
    }

    if (sessionUser.role !== 'admin' && sessionUser.name !== memory.createdBy) {
        return { success: false, message: 'You are not authorized to delete this memory.' };
    }

    const updatedMemories = memories.filter(m => m.id !== memoryId);
    await saveMemories(updatedMemories);

    revalidatePath('/memories');
    redirect('/memories');
}

export async function addMemoryCommentAction(memoryId: number, formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }

    const text = formData.get('comment') as string;
    if (!text.trim()) {
        return { success: false, message: 'Comment cannot be empty.' };
    }

    const memories = await getMemories();
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) {
        return { success: false, message: 'Memory not found.' };
    }

    memory.comments.push({
        id: Date.now(),
        author: sessionUser.name,
        text,
        timestamp: new Date().toISOString()
    });

    await saveMemories(memories);

    revalidatePath(`/memories/${memoryId}`);
    return { success: true, message: 'Comment added.' };
}

export async function deleteMemoryCommentAction(memoryId: number, commentId: number) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized.' };
    }

    const memories = await getMemories();
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) {
        return { success: false, message: 'Memory not found.' };
    }

    const commentIndex = memory.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
        return { success: false, message: 'Comment not found.' };
    }

    const comment = memory.comments[commentIndex];
    const isAuthor = comment.author === sessionUser.name;
    const isAdmin = sessionUser.role === 'admin';

    if (!isAuthor && !isAdmin) {
        return { success: false, message: 'You are not authorized to delete this comment.' };
    }

    memory.comments.splice(commentIndex, 1);
    await saveMemories(memories);
    revalidatePath(`/memories/${memoryId}`);
    return { success: true, message: 'Comment deleted.' };
}

export async function getLocationsAction() {
    return await getLocationsData();
}

export async function addLocationAction(formData: FormData) {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role === 'parent') {
        return { success: false, message: 'Unauthorized' };
    }

    const countryName = formData.get('countryName') as string;
    const countryCode = formData.get('countryCode') as string;
    const cityName = formData.get('cityName') as string | undefined;
    
    let lat: number | undefined;
    let lon: number | undefined;

    if (cityName) {
        const coords = await geocode(cityName, countryCode);
        if (coords) {
            lat = coords.latitude;
            lon = coords.longitude;
        } else {
            return { success: false, message: `Could not find coordinates for city: ${cityName}` };
        }
    }

    const newLocation: Location = {
        id: Date.now(),
        countryName,
        countryCode,
        cityName,
        latitude: lat,
        longitude: lon,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        visitedBy: sessionUser.name,
    };

    const locations = await getLocationsData();
    locations.push(newLocation);
    await saveLocations(locations);

    revalidatePath('/map');
    return { success: true, message: 'Location added!' };
}


export async function getSessionAction() {
  return await getSession();
}

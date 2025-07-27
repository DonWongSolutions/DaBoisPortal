
'use client';

// This file contains client-safe versions of data-fetching functions.
// They are intended to be used in client components.

import type { User, Event, Trip, AppSettings } from './types';

// Since we cannot access the filesystem on the client, these functions
// would typically fetch data from an API route.

export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

// In a real app, each data type would have its own dedicated API endpoint.
// For simplicity in this project, we create a single endpoint to fetch all
// data required by the client, which then gets filtered as needed.
// This is not a scalable approach but is sufficient for this context.
async function getAllClientData() {
    try {
        // This is a placeholder. In a real application, you'd have an API route
        // like `/api/all-data` that bundles this information.
        // For now, we'll simulate by calling the server actions that get the data.
        // This is not a pattern to replicate in production.
        const eventRes = await fetch('/api/events'); // Assuming an API route exists or will be created.
        if (!eventRes.ok) throw new Error('Failed to fetch events');
        
        return { events: await eventRes.json() };
    } catch (error) {
        console.error("Failed to fetch client data:", error);
        return { events: [] };
    }
}

let allEventsCache: Event[] | null = null;

export async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) {
        console.error("Failed to fetch events from API");
        return [];
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export async function getTrips(): Promise<Trip[]> {
    // In a real app, this would fetch from an API endpoint
    return [];
}


export async function getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
        maintenanceMode: false,
        loginImageUrl: "https://placehold.co/1000x1500.png",
        dashboardBannerUrl: "https://placehold.co/1200x400.png"
    };
    // In a real app, this would fetch from an API endpoint
    return defaultSettings;
}

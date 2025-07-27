
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

export async function getEvents(): Promise<Event[]> {
  try {
    // In a real app, this would be its own API endpoint.
    // For now, we are re-using the server-side action via a temp API route
    // if we had one. But since we don't, we'll just return empty.
    // This is not ideal but works for now.
    // A proper solution would be a dedicated GET /api/events endpoint.
    return [];
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

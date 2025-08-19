
'use client';

// This file contains client-safe versions of data-fetching functions
// that fetch data from the application's API routes.

import type { User, Event, Trip, AppSettings } from './types';

async function fetchFromApi<T>(endpoint: string, defaultValue: T): Promise<T> {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.error(`Failed to fetch from ${endpoint}: ${res.statusText}`);
      return defaultValue;
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return defaultValue;
  }
}

export async function getUsers(): Promise<User[]> {
  return fetchFromApi<User[]>('/api/users', []);
}

export async function getEvents(): Promise<Event[]> {
  return fetchFromApi<Event[]>('/api/events', []);
}

export async function getTrips(): Promise<Trip[]> {
  return fetchFromApi<Trip[]>('/api/trips', []);
}

export async function getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
        maintenanceMode: false,
        loginImageUrl: "https://placehold.co/1000x1500.png",
        dashboardBannerUrl: "https://placehold.co/1200x400.png"
    };
   // This would typically fetch from an API route like /api/settings
   // For now, we simulate this as there isn't a strong need for client-side settings fetching yet.
   return Promise.resolve(defaultSettings);
}


import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { User, Event, Trip, AppSettings } from './types';

const dataPath = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDirectory() {
    try {
        await fs.access(dataPath);
    } catch {
        await fs.mkdir(dataPath, { recursive: true });
    }
}

async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
    await ensureDataDirectory();
    const filePath = path.join(dataPath, filename);
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, create it with default value
            await writeJsonFile(filename, defaultValue);
            return defaultValue;
        }
        throw error;
    }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
    await ensureDataDirectory();
    const filePath = path.join(dataPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getUsers(): Promise<User[]> {
  const fileContent = await fs.readFile(path.join(dataPath, 'users.json'), 'utf-8');
  return JSON.parse(fileContent);
}

export async function getEvents(): Promise<Event[]> {
  return readJsonFile<Event[]>('events.json', []);
}

export async function saveEvents(events: Event[]): Promise<void> {
    await writeJsonFile('events.json', events);
}

export async function getTrips(): Promise<Trip[]> {
  return readJsonFile<Trip[]>('trips.json', []);
}

export async function saveTrips(trips: Trip[]): Promise<void> {
    await writeJsonFile('trips.json', trips);
}


export async function getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
        maintenanceMode: false,
        loginImageUrl: "https://placehold.co/1000x1500.png",
        dashboardBannerUrl: "https://placehold.co/1200x400.png"
    };
    return readJsonFile<AppSettings>('settings.json', defaultSettings);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await writeJsonFile('settings.json', settings);
}

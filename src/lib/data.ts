

import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { User, Event, Trip, AppSettings, Link, ChatMessage, Memory, WiseWord, Location } from './types';

const dataPath = path.join(process.cwd(), 'data');

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
        if (fileContent.trim() === '') {
            await writeJsonFile(filename, defaultValue);
            return defaultValue;
        }
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await writeJsonFile(filename, defaultValue);
            return defaultValue;
        }
        if (error instanceof SyntaxError) {
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
    const defaultUsers: User[] = [
      {
        "id": 1,
        "name": "Don",
        "password": "Frank",
        "role": "admin",
        "age": 28,
        "birthday": "1996-05-10",
        "phone": "123-456-7890",
        "email": "don@dabois.com",
        "profilePictureUrl": "",
        "forceInfoUpdate": false,
        "forcePasswordChange": false
      },
      {
        "id": 2,
        "name": "Isaac",
        "password": "Ballsac",
        "role": "member",
        "age": 14,
        "birthday": "2011-07-19",
        "phone": "234-567-momo",
        "email": "kokoko@j.om",
        "profilePictureUrl": "",
        "forceInfoUpdate": true,
        "forcePasswordChange": true
      },
      {
        "id": 3,
        "name": "Xavier",
        "password": "Egg",
        "role": "member",
        "age": 28,
        "birthday": "1996-03-22",
        "phone": "345-678-9012",
        "email": "xavier@dabois.com",
        "profilePictureUrl": "",
        "forceInfoUpdate": false,
        "forcePasswordChange": false
      },
      {
        "id": 4,
        "name": "Nathan",
        "password": "Eczema",
        "role": "member",
        "age": 26,
        "birthday": "1998-11-30",
        "phone": "456-789-0123",
        "email": "nathan@dabois.com",
        "profilePictureUrl": "",
        "forceInfoUpdate": false,
        "forcePasswordChange": false
      },
      {
        "id": 5,
        "name": "Parents",
        "password": "Parents",
        "role": "parent",
        "age": 55,
        "birthday": "1969-01-01",
        "phone": "555-555-5555",
        "email": "dad@dabois.com",
        "profilePictureUrl": "",
        "forceInfoUpdate": false,
        "forcePasswordChange": false
      }
    ];
    return readJsonFile<User[]>('users.json', defaultUsers);
}

export async function saveUsers(users: User[]): Promise<void> {
    await writeJsonFile('users.json', users);
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
        loginImageUrl: "https://roboconoxon.org.uk/wp-content/uploads/2025/07/DSC000441.jpg",
        dashboardBannerUrl: "https://roboconoxon.org.uk/wp-content/uploads/2025/07/bcf363b1-2a58-48c2-9abf-465ff7e630db-scaled.jpeg"
    };
    return readJsonFile<AppSettings>('settings.json', defaultSettings);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await writeJsonFile('settings.json', settings);
}

export async function getLinks(): Promise<Link[]> {
    return readJsonFile<Link[]>('links.json', []);
}

export async function saveLinks(links: Link[]): Promise<void> {
    await writeJsonFile('links.json', links);
}

export async function getChatMessages(): Promise<ChatMessage[]> {
    return readJsonFile<ChatMessage[]>('chat.json', []);
}

export async function saveChatMessages(messages: ChatMessage[]): Promise<void> {
    await writeJsonFile('chat.json', messages);
}

export async function getMemories(): Promise<Memory[]> {
    return readJsonFile<Memory[]>('memories.json', []);
}

export async function saveMemories(memories: Memory[]): Promise<void> {
    await writeJsonFile('memories.json', memories);
}

export async function getWiseWords(): Promise<WiseWord[]> {
    const words = await readJsonFile<WiseWord[]>('wiseWords.json', []);
    // Ensure all words have the new fields
    return words.map(word => ({
        upvotes: [],
        pinned: false,
        category: 'Common',
        ...word
    }));
}

export async function saveWiseWords(wiseWords: WiseWord[]): Promise<void> {
    await writeJsonFile('wiseWords.json', wiseWords);
}

export async function getLocations(): Promise<Location[]> {
    return readJsonFile<Location[]>('locations.json', []);
}

export async function saveLocations(locations: Location[]): Promise<void> {
    await writeJsonFile('locations.json', locations);
}

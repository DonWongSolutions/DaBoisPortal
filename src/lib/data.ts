

import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { User, Event, Trip, AppSettings, Link, ChatMessage } from './types';

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
        "email": "don@dabois.com"
      },
      {
        "id": 2,
        "name": "Isaac",
        "password": "Ballsac",
        "role": "member",
        "age": 27,
        "birthday": "1997-08-15",
        "phone": "234-567-8901",
        "email": "isaac@dabois.com"
      },
      {
        "id": 3,
        "name": "Xavier",
        "password": "Egg",
        "role": "member",
        "age": 28,
        "birthday": "1996-03-22",
        "phone": "345-678-9012",
        "email": "xavier@dabois.com"
      },
      {
        "id": 4,
        "name": "Nathan",
        "password": "Eczema",
        "role": "member",
        "age": 26,
        "birthday": "1998-11-30",
        "phone": "456-789-0123",
        "email": "nathan@dabois.com"
      },
      {
        "id": 5,
        "name": "Parents",
        "password": "Parents",
        "role": "parent",
        "age": 55,
        "birthday": "1969-01-01",
        "phone": "555-555-5555",
        "email": "dad@dabois.com"
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
        loginImageUrl: "https://placehold.co/1000x1500.png",
        dashboardBannerUrl: "https://placehold.co/1200x400.png"
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


import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import type { User, Event, Trip, AppSettings } from './types';

const dataPath = path.join(process.cwd(), 'data');

export async function getUsers(): Promise<User[]> {
  const fileContent = await fs.readFile(path.join(dataPath, 'users.json'), 'utf-8');
  return JSON.parse(fileContent);
}

export async function getEvents(): Promise<Event[]> {
  const fileContent = await fs.readFile(path.join(dataPath, 'events.json'), 'utf-8');
  return JSON.parse(fileContent);
}

export async function getTrips(): Promise<Trip[]> {
  const fileContent = await fs.readFile(path.join(dataPath, 'trips.json'), 'utf-8');
  return JSON.parse(fileContent);
}

export async function getSettings(): Promise<AppSettings> {
    const fileContent = await fs.readFile(path.join(dataPath, 'settings.json'), 'utf-8');
    return JSON.parse(fileContent);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await fs.writeFile(path.join(dataPath, 'settings.json'), JSON.stringify(settings, null, 2), 'utf-8');
}

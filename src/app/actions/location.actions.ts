'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getLocations as getLocationsData, saveLocations } from '@/lib/data';
import { geocode } from '@/services/geocoding';
import type { Location } from '@/lib/types';


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

export async function deleteLocationAction(locationId: number) {
    const sessionUser = await getSession();
    if (!sessionUser) {
        return { success: false, message: 'Unauthorized' };
    }

    const locations = await getLocationsData();
    const locationIndex = locations.findIndex(l => l.id === locationId);

    if (locationIndex === -1) {
        return { success: false, message: 'Location not found' };
    }

    const locationToDelete = locations[locationIndex];
    const isOwner = locationToDelete.visitedBy === sessionUser.name;
    const isAdmin = sessionUser.role === 'admin';

    if (!isOwner && !isAdmin) {
        return { success: false, message: 'You are not authorized to delete this record' };
    }

    locations.splice(locationIndex, 1);
    await saveLocations(locations);

    revalidatePath('/map');
    return { success: true, message: 'Location record deleted.' };
}

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
    let geojson: any | undefined;

    if (cityName) {
        const geoData = await geocode(cityName, countryCode);
        if (geoData) {
            lat = geoData.latitude;
            lon = geoData.longitude;
            geojson = geoData.geojson;
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
        geojson: geojson,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        visitedBy: sessionUser.name,
    };

    const locations = await getLocationsData();
    locations.push(newLocation);
    await saveLocations(locations);

    revalidatePath('/map');
    revalidatePath('/admin');
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

export async function backfillLocationDataAction() {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
        return { success: false, message: 'Unauthorized' };
    }

    const locations = await getLocationsData();
    let updatedCount = 0;
    
    for (const location of locations) {
        if (location.cityName && !location.geojson) {
             console.log(`Backfilling data for: ${location.cityName}, ${location.countryName}`);
            const geoData = await geocode(location.cityName, location.countryCode);
            if (geoData) {
                location.latitude = geoData.latitude;
                location.longitude = geoData.longitude;
                location.geojson = geoData.geojson;
                updatedCount++;
            } else {
                 console.log(`Could not find geo data for: ${location.cityName}`);
            }
             // Add a small delay to avoid rate-limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    if (updatedCount > 0) {
        await saveLocations(locations);
        revalidatePath('/map');
        revalidatePath('/admin');
        return { success: true, message: `Successfully backfilled boundary data for ${updatedCount} locations.` };
    }

    return { success: true, message: 'No locations needed updating.' };
}

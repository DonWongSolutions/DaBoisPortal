
'use server'

interface GeocodeResult {
    latitude: number;
    longitude: number;
}

/**
 * Fetches coordinates for a given city and country.
 * Uses the free Open-Meteo Geocoding API.
 * See: https://open-meteo.com/en/docs/geocoding-api
 */
export async function geocode(city: string, countryCode: string): Promise<GeocodeResult | null> {
    try {
        const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
        url.searchParams.append('name', city);
        url.searchParams.append('country', countryCode);
        url.searchParams.append('count', '1');

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Geocoding API failed with status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude } = data.results[0];
            return { latitude, longitude };
        }
        
        return null;
    } catch (error) {
        console.error('Error in geocoding service:', error);
        return null;
    }
}

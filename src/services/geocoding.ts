
'use server'

interface GeocodeResult {
    latitude: number;
    longitude: number;
    geojson: any;
}

/**
 * Fetches coordinates and boundary data for a given city and country.
 * Uses the Nominatim API.
 * See: https://nominatim.org/release-docs/develop/api/Search/
 */
export async function geocode(city: string, countryCode: string): Promise<GeocodeResult | null> {
    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.append('city', city);
        url.searchParams.append('countrycodes', countryCode);
        url.searchParams.append('format', 'json');
        url.searchParams.append('polygon_geojson', '1');
        url.searchParams.append('limit', '1');

        const response = await fetch(url, {
             headers: {
                // Nominatim requires a custom User-Agent header
                'User-Agent': 'DaBoisPortal/1.0 (Contact: don.wong@roboconoxon.org.uk)'
            }
        });
        if (!response.ok) {
            console.error(`Geocoding API failed with status: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
            const result = data[0];
            const { lat, lon, geojson } = result;
            return {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                geojson: geojson
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error in geocoding service:', error);
        return null;
    }
}


'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Location } from '@/lib/types';
import { useTheme } from 'next-themes';
import { useMemo, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

// Fix for default marker icon issue with webpack
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

const cityIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function WorldMap({ locations }: { locations: Location[] }) {
    const { resolvedTheme } = useTheme();
    const [isClient, setIsClient] = useState(false);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        setIsClient(true);
        // Cleanup function to remove the map instance
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const cityLocations = useMemo(() => {
        const cities: { [key: string]: { location: Location, visits: Location[] } } = {};
        locations.forEach(loc => {
            if (loc.latitude && loc.longitude) {
                const key = `${loc.latitude},${loc.longitude}`;
                if (!cities[key]) {
                    cities[key] = { location: loc, visits: [] };
                }
                cities[key].visits.push(loc);
            }
        });
        return Object.values(cities);
    }, [locations]);

    const tileLayerUrl = resolvedTheme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    const attribution = resolvedTheme === 'dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (!isClient) {
        return <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center"><p>Loading Map...</p></div>;
    }

    return (
        <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            style={{ height: '60vh', width: '100%' }} 
            className="rounded-lg z-0"
            whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        >
            <TileLayer
                url={tileLayerUrl}
                attribution={attribution}
                key={resolvedTheme} 
            />
            {cityLocations.map(({ location, visits }) => (
                <Marker key={location.id} position={[location.latitude!, location.longitude!]} icon={cityIcon}>
                    <Popup>
                        <div className="space-y-1">
                            <p className="font-bold">{location.cityName}, {location.countryName}</p>
                            <hr className="my-1"/>
                            {visits.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(visit => (
                                <p key={visit.id} className="text-xs">
                                    <strong>{visit.visitedBy}:</strong> {format(new Date(visit.startDate), 'MMM yyyy')}
                                </p>
                            ))}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

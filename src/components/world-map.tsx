
'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Marker, Source, Layer, FillLayer } from 'react-map-gl';
import { useTheme } from 'next-themes';
import type { Location } from '@/lib/types';
import { useMemo } from 'react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const geoJsonUrl = "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson";

const visitedLayerStyle: FillLayer = {
    id: 'visited-countries',
    type: 'fill',
    paint: {
        'fill-color': '#60A5FA',
        'fill-opacity': 0.5
    }
};

const darkVisitedLayerStyle: FillLayer = {
    id: 'visited-countries',
    type: 'fill',
    paint: {
        'fill-color': '#3B82F6',
        'fill-opacity': 0.5
    }
};

function MissingTokenCard() {
    return (
        <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center border">
            <div className="text-center p-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Mapbox Token Required</h3>
                <p className="text-sm text-muted-foreground">
                    To display this map, please get a free access token from <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline">Mapbox</a>.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Then, create a file named <code className="bg-muted-foreground/20 px-1 py-0.5 rounded-sm">.env.local</code> in the root of this project and add your token:
                </p>
                <pre className="bg-muted-foreground/20 text-xs rounded-md p-2 mt-2 text-left">
                    <code>NEXT_PUBLIC_MAPBOX_TOKEN=&quot;YOUR_TOKEN_HERE&quot;</code>
                </pre>
            </div>
        </div>
    );
}

export default function WorldMap({ locations }: { locations: Location[] }) {
    const { resolvedTheme } = useTheme();

    const visitedCountryCodes = useMemo(() => {
        return locations.map(loc => loc.countryCode.toUpperCase());
    }, [locations]);

    const cityMarkers = useMemo(() => {
        return locations.filter(loc => loc.latitude && loc.longitude);
    }, [locations]);

    const filter = useMemo(() => ['in', 'ISO_A2', ...visitedCountryCodes], [visitedCountryCodes]);
    
    if (!MAPBOX_TOKEN) {
        return <MissingTokenCard />;
    }

    const mapStyle = resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';
    const layerStyle = resolvedTheme === 'dark' ? darkVisitedLayerStyle : visitedLayerStyle;
    
    return (
        <div data-testid="world-map" className="w-full aspect-video bg-muted rounded-lg border overflow-hidden">
            <Map
                initialViewState={{
                    longitude: 10,
                    latitude: 30,
                    zoom: 1.5
                }}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle={mapStyle}
                style={{ width: '100%', height: '100%' }}
                projection={{name: 'mercator'}}
            >
                <Source id="countries" type="geojson" data={geoJsonUrl}>
                    <Layer {...layerStyle} filter={filter} />
                </Source>

                {cityMarkers.map(loc => (
                    <Marker key={loc.id} longitude={loc.longitude!} latitude={loc.latitude!}>
                         <div className="w-2 h-2 bg-red-500 rounded-full border-2 border-white" title={`${loc.cityName}, ${loc.countryName}`} />
                    </Marker>
                ))}
            </Map>
        </div>
    );
}

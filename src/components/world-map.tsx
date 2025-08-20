
'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Source, Layer, FillLayer, Popup } from 'react-map-gl';
import { useTheme } from 'next-themes';
import type { Location } from '@/lib/types';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const geoJsonUrl = "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson";

const countryLayerStyle: FillLayer = {
    id: 'visited-countries',
    type: 'fill',
    paint: {
        'fill-color': '#4F86B5',
        'fill-opacity': 0.3
    }
};
const countryHighlightLayerStyle: FillLayer = {
    id: 'highlighted-country',
    type: 'fill',
    paint: {
        'fill-color': '#4F86B5',
        'fill-opacity': 0.6
    },
};

const cityLayerStyle: FillLayer = {
    id: 'visited-cities',
    type: 'fill',
    paint: {
        'fill-color': '#DE3636',
        'fill-opacity': 0.5,
        'fill-outline-color': '#931A1A'
    }
};

const cityHighlightLayerStyle: FillLayer = {
    id: 'highlighted-city',
    type: 'fill',
    paint: {
        'fill-color': '#DE3636',
        'fill-opacity': 0.8
    },
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
                    <code>NEXT_PUBLIC_MAPBOX_TOKEN="YOUR_TOKEN_HERE"</code>
                </pre>
            </div>
        </div>
    );
}

interface HoverInfo {
    longitude: number;
    latitude: number;
    name: string;
    visitors: {
        visitedBy: string;
        startDate: string;
        endDate: string;
    }[];
}

export default function WorldMap({ locations, view }: { locations: Location[], view: 'countries' | 'cities' }) {
    const { resolvedTheme } = useTheme();
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

    const visitedCountryCodes = useMemo(() => Array.from(new Set(locations.map(loc => loc.countryCode.toUpperCase()))), [locations]);
    const countryFilter = useMemo(() => ['in', 'ISO_A2', ...visitedCountryCodes], [visitedCountryCodes]);
    
    const cityGeoJSON = useMemo(() => {
        const features = locations.filter(loc => loc.geojson).map(loc => ({
            type: 'Feature',
            geometry: loc.geojson,
            properties: { id: loc.id, name: loc.cityName }
        }));
        return { type: 'FeatureCollection', features };
    }, [locations]);

    const locationsByCountry = useMemo(() => {
        return locations.reduce((acc, loc) => {
            if (!acc[loc.countryName]) acc[loc.countryName] = [];
            acc[loc.countryName].push(loc);
            return acc;
        }, {} as Record<string, Location[]>);
    }, [locations]);

    const locationsByCity = useMemo(() => {
        return locations.reduce((acc, loc) => {
            if (loc.cityName) {
                if (!acc[loc.cityName]) acc[loc.cityName] = [];
                acc[loc.cityName].push(loc);
            }
            return acc;
        }, {} as Record<string, Location[]>);
    }, [locations]);

    if (!MAPBOX_TOKEN) {
        return <MissingTokenCard />;
    }

    const mapStyle = resolvedTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';
    const interactiveLayerIds = view === 'countries' ? ['visited-countries'] : ['visited-cities'];


    const onHover = (event: mapboxgl.MapLayerMouseEvent) => {
        if (event.features && event.features.length > 0) {
            const feature = event.features[0];
            const name = feature.properties?.name || feature.properties?.NAME_EN;
            let visitors;
            
            if (feature.layer.id === 'visited-cities') {
                visitors = locationsByCity[name] || [];
            } else if (feature.layer.id === 'visited-countries') {
                visitors = locationsByCountry[name] || [];
            } else {
                 setHoverInfo(null);
                 return;
            }

            if (visitors.length > 0) {
                setHoverInfo({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                    name: name,
                    visitors: visitors.map(v => ({ visitedBy: v.visitedBy, startDate: v.startDate, endDate: v.endDate }))
                });
            } else {
                 setHoverInfo(null);
            }
        } else {
            setHoverInfo(null);
        }
    };
    
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
                interactiveLayerIds={interactiveLayerIds}
                onMouseMove={onHover}
                onMouseLeave={() => setHoverInfo(null)}
            >
                {view === 'countries' && (
                    <Source id="countries" type="geojson" data={geoJsonUrl}>
                        <Layer {...countryLayerStyle} filter={countryFilter} />
                        {hoverInfo && hoverInfo.visitors.some(v => v.visitedBy) && (
                            <Layer {...countryHighlightLayerStyle} filter={['==', 'NAME_EN', hoverInfo.name]} />
                        )}
                    </Source>
                )}

                {view === 'cities' && (
                     <Source id="cities" type="geojson" data={cityGeoJSON}>
                        <Layer {...cityLayerStyle} />
                         {hoverInfo && hoverInfo.visitors.some(v => v.visitedBy) && (
                            <Layer {...cityHighlightLayerStyle} filter={['==', 'name', hoverInfo.name]} />
                        )}
                    </Source>
                )}

                {hoverInfo && (
                    <Popup
                        longitude={hoverInfo.longitude}
                        latitude={hoverInfo.latitude}
                        closeButton={false}
                        closeOnClick={false}
                        anchor="top"
                        className="!rounded-lg !bg-popover !text-popover-foreground !p-0"
                        style={{
                            backgroundColor: 'white',
                            color: 'black',
                            border: '1px solid black',
                            borderRadius: '8px',
                            padding: '10px'
                        }}
                    >
                       <div className="p-2">
                           <h3 className="font-bold text-base mb-1">{hoverInfo.name}</h3>
                           <ul className="space-y-1">
                            {hoverInfo.visitors.map((v, i) => (
                                <li key={i} className="text-sm">
                                    <strong>{v.visitedBy}</strong>: {format(new Date(v.startDate), 'PP')} - {format(new Date(v.endDate), 'PP')}
                                </li>
                            ))}
                           </ul>
                       </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}

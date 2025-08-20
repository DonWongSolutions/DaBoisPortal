
'use client';

import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { useTheme } from 'next-themes';
import type { Location } from '@/lib/types';
import { useMemo } from 'react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function WorldMap({ locations }: { locations: Location[] }) {
    const { resolvedTheme } = useTheme();

    const visitedCountryCodes = useMemo(() => {
        return new Set(locations.map(loc => loc.countryCode.toUpperCase()));
    }, [locations]);

    const cityMarkers = useMemo(() => {
        return locations.filter(loc => loc.latitude && loc.longitude);
    }, [locations]);

    const colors = {
        default: resolvedTheme === 'dark' ? '#374151' : '#E5E7EB',
        hover: resolvedTheme === 'dark' ? '#FBBF24' : '#F59E0B',
        visited: resolvedTheme === 'dark' ? '#3B82F6' : '#60A5FA',
        marker: resolvedTheme === 'dark' ? '#F87171' : '#EF4444',
        markerStroke: resolvedTheme === 'dark' ? '#FFFFFF' : '#FFFFFF',
    };

    return (
        <div data-testid="world-map" className="w-full aspect-video bg-muted rounded-lg border">
            <ComposableMap projection="geoMercator">
                <ZoomableGroup center={[0, 20]} zoom={1}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map(geo => {
                                const isVisited = visitedCountryCodes.has(geo.properties.ISO_A2);
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={isVisited ? colors.visited : colors.default}
                                        stroke="#FFF"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: 'none' },
                                            hover: { fill: colors.hover, outline: 'none' },
                                            pressed: { outline: 'none' },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                    {cityMarkers.map(loc => (
                         <Marker key={loc.id} coordinates={[loc.longitude!, loc.latitude!]}>
                            <circle r={2} fill={colors.marker} stroke={colors.markerStroke} strokeWidth={1} />
                            <title>{`${loc.cityName}, ${loc.countryName}`}</title>
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
}

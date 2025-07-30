
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, addLocationAction, getLocationsAction, deleteLocationAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User, Location } from '@/lib/types';
import { format } from 'date-fns';
import { PlusCircle, Globe, Trash2 } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function AddLocationForm() {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await addLocationAction(formData);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            formRef.current?.reset();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        return result;
    }, { success: false, message: '' });

    const { pending } = useFormStatus();

    return (
        <form action={formAction} ref={formRef}>
            <Card>
                <CardHeader>
                    <CardTitle>Add a Visited Location</CardTitle>
                    <CardDescription>Log a new place you have visited.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="countryName">Country Name</Label>
                            <Input id="countryName" name="countryName" placeholder="e.g. Japan" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="countryCode">Country Code</Label>
                            <Input id="countryCode" name="countryCode" placeholder="e.g. JP" maxLength={2} required />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="cityName">City Name (Optional)</Label>
                        <Input id="cityName" name="cityName" placeholder="e.g. Tokyo" />
                        <p className="text-xs text-muted-foreground">If you add a city, a specific point will be marked on the map.</p>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input id="startDate" name="startDate" type="date" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input id="endDate" name="endDate" type="date" required />
                        </div>
                    </div>
                </CardContent>
                <CardContent>
                    <Button type="submit" disabled={pending} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {pending ? 'Adding...' : 'Add Location'}
                    </Button>
                </CardContent>
            </Card>
        </form>
    );
}

function WorldMap({ locations }: { locations: Location[] }) {
    const visitedCountryCodes = [...new Set(locations.map(loc => loc.countryCode.toUpperCase()))];
    const cityLocations = locations.filter(loc => loc.latitude && loc.longitude);
    const [tooltipContent, setTooltipContent] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0 relative" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltipContent(null)}>
                {tooltipContent && (
                    <div
                        className="absolute z-10 p-2 text-sm bg-black text-white rounded-md pointer-events-none"
                        style={{ top: tooltipPosition.y, left: tooltipPosition.x, transform: 'translate(10px, -100%)' }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: tooltipContent }} />
                    </div>
                )}
                <div className="w-full aspect-video">
                    <ComposableMap projection="geoMercator">
                        <ZoomableGroup center={[0, 20]} zoom={1}>
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const isVisited = visitedCountryCodes.includes(geo.properties.iso_a2);
                                        const countryVisits = locations.filter(l => l.countryCode.toUpperCase() === geo.properties.iso_a2);
                                        
                                        const countryTooltip = `
                                            <p class="font-bold">${geo.properties.name}</p>
                                            ${countryVisits.map(loc => `
                                                <p class="text-xs">
                                                   ${loc.cityName ? `${loc.cityName}, ` : ''} ${loc.visitedBy} (${format(new Date(loc.startDate), 'MMM yyyy')})
                                                </p>
                                            `).join('')}
                                        `;

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={isVisited ? "#4682B4" : "#D6D6DA"}
                                                stroke="#FFF"
                                                onMouseEnter={() => { if(isVisited) setTooltipContent(countryTooltip)}}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { outline: "none", fill: isVisited ? "#3672a4" : "#C6C6DA" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                             {cityLocations.map(loc => {
                                const cityTooltip = `
                                    <p class="font-bold">${loc.cityName}, ${loc.countryName}</p>
                                    <p class="text-xs">${loc.visitedBy} (${format(new Date(loc.startDate), 'MMM yyyy')})</p>
                                `;
                                return (
                                    <Marker 
                                        key={loc.id} 
                                        coordinates={[loc.longitude!, loc.latitude!]}
                                        onMouseEnter={() => setTooltipContent(cityTooltip)}
                                    >
                                        <circle r={3} fill="#E53E3E" stroke="#FFF" strokeWidth={1} />
                                    </Marker>
                                )
                            })}
                        </ZoomableGroup>
                    </ComposableMap>
                </div>
            </CardContent>
        </Card>
    );
}

function LocationHistory({ locations, user, onDelete }: { locations: Location[], user: User, onDelete: (id: number) => void }) {
    if (locations.length === 0) {
        return <p className="text-muted-foreground text-center py-4">No locations have been logged yet.</p>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Location History</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Country</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Visitor</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locations.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(loc => {
                             const canDelete = user.role === 'admin' || user.name === loc.visitedBy;
                             return (
                                <TableRow key={loc.id}>
                                    <TableCell>{loc.countryName}</TableCell>
                                    <TableCell>{loc.cityName || 'N/A'}</TableCell>
                                    <TableCell>{loc.visitedBy}</TableCell>
                                    <TableCell>{format(new Date(loc.startDate), 'PP')} - {format(new Date(loc.endDate), 'PP')}</TableCell>
                                    <TableCell className="text-right">
                                        {canDelete && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this location record. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDelete(loc.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function MapPage() {
    const [user, setUser] = useState<User | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchLocations = async () => {
        try {
            const fetchedLocations = await getLocationsAction();
            setLocations(fetchedLocations);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser) {
                    redirect('/login');
                    return;
                }
                setUser(sessionUser);
                await fetchLocations();
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();

        const interval = setInterval(fetchLocations, 5000);
        return () => clearInterval(interval);
    }, []);
    
    const handleDeleteLocation = async (id: number) => {
        const result = await deleteLocationAction(id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            fetchLocations(); // Refresh the list
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading map...</div>;
    }
    if (!user) {
        return <div>Redirecting...</div>
    }

    const totalCountries = 195; // Approximate number of countries
    const visitedCount = new Set(locations.map(l => l.countryCode.toUpperCase())).size;
    const exploredPercentage = ((visitedCount / totalCountries) * 100).toFixed(1);

    return (
        <AppShell user={user}>
            <PageHeader
                title="World Exploration Map"
                description="A map of all the places Da Bois have been."
            />

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <WorldMap locations={locations} />
                    <LocationHistory locations={locations} user={user} onDelete={handleDeleteLocation} />
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Exploration Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">{exploredPercentage}%</p>
                            <p className="text-muted-foreground">of the world explored ({visitedCount} / {totalCountries} countries)</p>
                        </CardContent>
                    </Card>
                    {user.role !== 'parent' && <AddLocationForm />}
                </div>
            </div>
        </AppShell>
    );
}

    

    

    

'use client';

import { useEffect, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import { getTrips } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { addItineraryItemAction, addCostItemAction, getSessionAction } from '@/app/actions';
import { MapPin, Calendar, Users, Plane, DollarSign, PlusCircle } from 'lucide-react';
import type { Trip, User } from '@/lib/types';
import { useFormStatus } from 'react-dom';

function AddItineraryForm({ trip }: { trip: Trip }) {
    const { pending } = useFormStatus();
    const addItineraryItemWithTripId = addItineraryItemAction.bind(null, trip.id);
    const [form, setForm] = useState<HTMLFormElement | null>(null);

    return (
        <form ref={setForm} action={async (formData) => {
            await addItineraryItemWithTripId(formData);
            form?.reset();
        }}>
            <Card>
                <CardHeader>
                    <CardTitle>Add Itinerary Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="day">Day</Label>
                        <Input id="day" name="day" type="date" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input id="time" name="time" type="time" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={pending}>
                       <PlusCircle className="mr-2 h-4 w-4" /> {pending ? 'Adding...' : 'Add Item'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

function AddCostForm({ trip }: { trip: Trip }) {
    const { pending } = useFormStatus();
    const addCostItemWithTripId = addCostItemAction.bind(null, trip.id);
    const [form, setForm] = useState<HTMLFormElement | null>(null);

    return (
        <form ref={setForm} action={async (formData) => {
            await addCostItemWithTripId(formData);
            form?.reset();
        }}>
            <Card>
                <CardHeader>
                    <CardTitle>Add Cost Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="item">Item/Service</Label>
                        <Input id="item" name="item" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="paidBy">Paid By</Label>
                        <Select name="paidBy" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select who paid" />
                            </SelectTrigger>
                            <SelectContent>
                                {trip.attendees.map(name => (
                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={pending}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {pending ? 'Adding...' : 'Add Cost'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}


export default function TripDetailsPage() {
    const params = useParams();
    const tripId = Number(params.id);
    const [user, setUser] = useState<User | null>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const sessionUser = await getSessionAction();
            if (!sessionUser) {
                redirect('/login');
                return;
            }
            const allTrips = await getTrips();
            const currentTrip = allTrips.find(t => t.id === tripId);
            
            if (!currentTrip) {
                 redirect('/trips');
                 return;
            }

            setUser(sessionUser);
            setTrip(currentTrip);
            setLoading(false);
        }
        fetchData();
    }, [tripId]);

    if (loading || !user || !trip) {
        return (
            <AppShell user={user!}>
                <PageHeader title="Trip Details" />
                <p>Loading...</p>
            </AppShell>
        );
    }
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    const totalCost = trip.costs.reduce((sum, item) => sum + item.amount, 0);
    const costPerPerson = trip.attendees.length > 0 ? totalCost / trip.attendees.length : 0;

    return (
        <AppShell user={user}>
            <PageHeader
                title={trip.name}
                description={trip.destination}
            />

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    {/* Itinerary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5" /> Itinerary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {trip.itinerary.length > 0 ? (
                                <div className="space-y-6">
                                    {trip.itinerary.map((day, index) => (
                                        <div key={index}>
                                            <h3 className="font-semibold text-lg mb-2 border-b pb-2">{formatDate(day.day)}</h3>
                                            <ul className="space-y-2">
                                                {day.activities.map((activity, actIndex) => (
                                                     <li key={actIndex} className="flex items-baseline gap-4">
                                                        <span className="font-mono text-sm text-muted-foreground w-16">{activity.time}</span>
                                                        <span>{activity.description}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted-foreground text-center py-8">No itinerary items yet. Add one to get started!</p>}
                        </CardContent>
                    </Card>
                     {/* Costs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Costs</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {trip.costs.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Paid By</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trip.costs.map(cost => (
                                            <TableRow key={cost.id}>
                                                <TableCell>{cost.item}</TableCell>
                                                <TableCell>{cost.paidBy}</TableCell>
                                                <TableCell className="text-right font-mono">${cost.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             ) : <p className="text-muted-foreground text-center py-8">No costs logged yet.</p>}
                        </CardContent>
                        {trip.costs.length > 0 && (
                             <CardFooter className="flex justify-end gap-8 bg-muted/50 p-4 rounded-b-lg">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Total Cost</p>
                                    <p className="text-lg font-bold">${totalCost.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Cost Per Person</p>
                                    <p className="text-lg font-bold">${costPerPerson.toFixed(2)}</p>
                                </div>
                             </CardFooter>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8">
                     {/* Trip Info */}
                    <Card>
                        <CardHeader>
                             <CardTitle>Trip Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(trip.startDate)} to {formatDate(trip.endDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{trip.attendees.length} members going</span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {trip.attendees.map(name => (
                                     <div key={name} className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={`https://placehold.co/32x32`} data-ai-hint="user avatar" />
                                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{name}</span>
                                     </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <AddItineraryForm trip={trip} />
                    <AddCostForm trip={trip} />
                </div>
            </div>
        </AppShell>
    );
}


'use client';

import { useRef } from 'react';
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
import { addItineraryItemAction, addCostItemAction, addTripSuggestionAction } from '@/app/actions';
import { MapPin, Calendar, Users, Plane, DollarSign, PlusCircle, Lightbulb, Send } from 'lucide-react';
import type { Trip, User, ItineraryActivity } from '@/lib/types';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

function AddItineraryForm({ trip }: { trip: Trip }) {
    const { pending } = useFormStatus();
    const addItineraryItemWithTripId = addItineraryItemAction.bind(null, trip.id);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form ref={formRef} action={async (formData) => {
            await addItineraryItemWithTripId(formData);
            formRef.current?.reset();
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
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input id="startTime" name="startTime" type="time" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input id="endTime" name="endTime" type="time" required />
                        </div>
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

function AddCostForm({ trip, allUsers }: { trip: Trip, allUsers: User[] }) {
    const { pending } = useFormStatus();
    const addCostItemWithTripId = addCostItemAction.bind(null, trip.id);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form ref={formRef} action={async (formData) => {
            await addCostItemWithTripId(formData);
            formRef.current?.reset();
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
                                {allUsers.filter(u => u.role !== 'parent').map(user => (
                                    <SelectItem key={user.name} value={user.name}>{user.name}</SelectItem>
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

function AddSuggestionForm({ tripId }: { tripId: number }) {
    const { pending } = useFormStatus();
    const addSuggestionWithId = addTripSuggestionAction.bind(null, tripId);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form ref={formRef} action={async (formData) => {
            await addSuggestionWithId(formData);
            formRef.current?.reset();
        }}>
            <Card>
                <CardHeader>
                    <CardTitle>Add Suggestion</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea name="suggestion" placeholder="e.g., 'We should visit the museum.'" required />
                </CardContent>
                <CardFooter>
                     <Button type="submit" disabled={pending} className="w-full">
                        <Send className="mr-2 h-4 w-4" /> {pending ? 'Submitting...' : 'Submit Suggestion'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

function DayScheduleView({ activities }: { activities: ItineraryActivity[] }) {
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23

    const timeToMinutes = (time: string) => {
        if (!time || !time.includes(':')) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    return (
        <div className="relative h-[1440px] bg-muted/30 rounded-lg">
             {/* Hour markers */}
            {hours.map(hour => (
                <div key={hour} className="absolute w-full" style={{ top: `${hour * 60}px`}}>
                    <div className="flex items-center">
                        <span className="text-xs text-muted-foreground font-mono w-12 text-right pr-2">{hour.toString().padStart(2, '0')}:00</span>
                        <div className="flex-1 border-b border-dashed border-muted"></div>
                    </div>
                </div>
            ))}

            {/* Activities */}
            {activities.map((activity, index) => {
                const startMinutes = timeToMinutes(activity.startTime);
                const endMinutes = timeToMinutes(activity.endTime);
                const duration = Math.max(0, endMinutes - startMinutes);
                
                return (
                    <div 
                        key={index} 
                        className="absolute left-12 right-0 p-2 rounded-lg bg-accent text-accent-foreground shadow"
                        style={{
                            top: `${startMinutes}px`,
                            height: `${duration}px`,
                        }}
                    >
                       <p className="font-semibold text-sm">{activity.description}</p>
                       <p className="text-xs">{activity.startTime} - {activity.endTime}</p>
                    </div>
                );
            })}
        </div>
    );
}

export function TripDetailsClientPage({ user, trip, allUsers }: { user: User; trip: Trip, allUsers: User[] }) {
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

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
                                            <h3 className="font-semibold text-lg mb-4 border-b pb-2">{formatDate(day.day)}</h3>
                                            <div className="relative overflow-y-auto max-h-[600px] pr-2">
                                              <DayScheduleView activities={day.activities} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (<p className="text-muted-foreground text-center py-8">No itinerary items yet. Add one to get started!</p>)}
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
                             ) : (<p className="text-muted-foreground text-center py-8">No costs logged yet.</p>)}
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
                    {/* Suggestions */}
                    {trip.suggestions && trip.suggestions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5" /> Suggestions</CardTitle>
                            </Header>
                            <CardContent className="space-y-2">
                                {trip.suggestions.map((s, i) => (
                                     <p key={i} className="text-sm text-muted-foreground"><strong>{s.suggestedBy}:</strong> {s.suggestion}</p>
                                ))}
                            </CardContent>
                        </Card>
                    )}
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
                    {user.role === 'parent' ? (
                        <AddSuggestionForm tripId={trip.id} />
                    ) : (
                       <>
                        <AddItineraryForm trip={trip} />
                        <AddCostForm trip={trip} allUsers={allUsers} />
                       </>
                    )}
                </div>
            </div>
        </AppShell>
    );
}


'use client';

import { useRef, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { addItineraryItemAction, addCostItemAction, addTripSuggestionAction, createEventFromTripAction, deleteTripAction } from '@/app/actions';
import { MapPin, Calendar, Users, Plane, DollarSign, PlusCircle, Lightbulb, Send, Megaphone, Trash2 } from 'lucide-react';
import type { Trip, User, ItineraryActivity } from '@/lib/types';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function AddItineraryForm({ trip }: { trip: Trip }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await addItineraryItemAction(trip.id, formData);
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            formRef.current?.reset();
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        }
        return result;
    }, { success: false, message: ''});
    
    const { pending } = useFormStatus();

    return (
        <form ref={formRef} action={formAction}>
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

function PublishEventForm({ trip, eventExists, user }: { trip: Trip, eventExists: boolean, user: User }) {
    const { toast } = useToast();
    const router = useRouter();

    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createEventFromTripAction(formData);
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            // Redirect to events page after a short delay to show toast
            setTimeout(() => router.push('/events'), 1000);
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        }
        return result;
    }, { success: false, message: ''});
    const { pending } = useFormStatus();
    
    const deleteTripById = deleteTripAction.bind(null, trip.id);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Trip Actions</CardTitle>
            </CardHeader>
             <CardContent>
                {eventExists ? (
                    <p className="text-sm text-muted-foreground">An event for this trip has already been published.</p>
                ) : (
                    <form action={formAction}>
                        <input type="hidden" name="tripId" value={trip.id} />
                        <div className="flex items-center justify-between rounded-lg border p-4 mb-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="isFamilyEvent" className="text-base">Include Parents</Label>
                                <p className="text-sm text-muted-foreground">
                                    Make the event visible to parents.
                                </p>
                            </div>
                            <Switch id="isFamilyEvent" name="isFamilyEvent" />
                        </div>
                         <Button type="submit" className="w-full" disabled={pending}>
                            {pending ? 'Publishing...' : 'Publish to Events'}
                        </Button>
                    </form>
                )}
             </CardContent>
             <CardFooter className="flex flex-col gap-2">
                 {eventExists && (
                     <Button className="w-full" variant="outline" asChild>
                        <a href="/events">View Event</a>
                    </Button>
                 )}
                {user.role === 'admin' && (
                     <form action={deleteTripById} className="w-full">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Trip
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the trip "{trip.name}" and any associated events.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Button type="submit">Yes, delete trip</Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </form>
                )}
             </CardFooter>
        </Card>
    )
}

export function TripDetailsClientPage({ user, trip, allUsers, eventExists }: { user: User; trip: Trip, allUsers: User[], eventExists: boolean }) {
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const totalCost = trip.costs.reduce((sum, item) => sum + item.amount, 0);
    const costPerPerson = trip.attendees.length > 0 ? totalCost / trip.attendees.length : 0;
    const canManageTrip = user.role === 'admin' || user.name === trip.createdBy;

    const defaultAccordionItems = ["itinerary", "costs"];
    if (trip.suggestions && trip.suggestions.length > 0) {
        defaultAccordionItems.push("suggestions");
    }

    return (
        <AppShell user={user}>
            <PageHeader
                title={trip.name}
                description={trip.destination}
            />

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <Accordion type="multiple" defaultValue={defaultAccordionItems} className="w-full space-y-4">
                        <AccordionItem value="itinerary" className="border rounded-lg bg-card">
                             <AccordionTrigger className="p-6">
                                <CardTitle className="flex items-center gap-2 text-xl"><Plane className="h-5 w-5" /> Itinerary</CardTitle>
                             </AccordionTrigger>
                             <AccordionContent className="p-6 pt-0">
                                {trip.itinerary.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                             </AccordionContent>
                        </AccordionItem>
                        
                         <AccordionItem value="costs" className="border rounded-lg bg-card">
                            <AccordionTrigger className="p-6">
                               <CardTitle className="flex items-center gap-2 text-xl"><DollarSign className="h-5 w-5" /> Costs</CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0">
                                {trip.costs.length > 0 ? (
                                    <>
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
                                        <CardFooter className="flex justify-end gap-8 bg-muted/50 p-4 rounded-b-lg mt-4">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Total Cost</p>
                                                <p className="text-lg font-bold">${totalCost.toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Cost Per Person</p>
                                                <p className="text-lg font-bold">${costPerPerson.toFixed(2)}</p>
                                            </div>
                                        </CardFooter>
                                    </>
                                ) : (<p className="text-muted-foreground text-center py-8">No costs logged yet.</p>)}
                            </AccordionContent>
                         </AccordionItem>

                         {trip.suggestions && trip.suggestions.length > 0 && (
                             <AccordionItem value="suggestions" className="border rounded-lg bg-card">
                                 <AccordionTrigger className="p-6">
                                    <CardTitle className="flex items-center gap-2 text-xl"><Lightbulb className="h-5 w-5" /> Suggestions</CardTitle>
                                 </AccordionTrigger>
                                 <AccordionContent className="p-6 pt-0 space-y-2">
                                    {trip.suggestions.map((s, i) => (
                                         <p key={i} className="text-sm text-muted-foreground"><strong>{s.suggestedBy}:</strong> {s.suggestion}</p>
                                    ))}
                                 </AccordionContent>
                             </AccordionItem>
                         )}
                    </Accordion>
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
                                            <AvatarImage src={allUsers.find(u => u.name === name)?.profilePictureUrl} data-ai-hint="user avatar" />
                                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{name}</span>
                                     </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                     {canManageTrip && <PublishEventForm trip={trip} eventExists={eventExists} user={user} /> }

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

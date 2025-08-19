
'use client';

import { useRef, useActionState, useState } from 'react';
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
import { addItineraryItemAction, addCostItemAction, addTripSuggestionAction, createEventFromTripAction, updateItineraryItemAction, deleteItineraryItemAction } from '@/app/actions';
import { Calendar, Users, Plane, DollarSign, PlusCircle, Lightbulb, Send, Megaphone, Trash2, Pencil } from 'lucide-react';
import type { Trip, User, ItineraryActivity } from '@/lib/types';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function EditItineraryItemDialog({ tripId, activity, onUpdate, children }: { tripId: number, activity: ItineraryActivity, onUpdate: () => void, children: React.ReactNode }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const action = updateItineraryItemAction.bind(null, tripId, activity.id);

    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await action(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setOpen(false);
            onUpdate();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
        return result;
    }, { success: false, message: '' });

    const { pending } = useFormStatus();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                 <form ref={formRef} action={formAction}>
                    <DialogHeader>
                        <DialogTitle>Edit Itinerary Item</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input id="startTime" name="startTime" type="time" defaultValue={activity.startTime} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input id="endTime" name="endTime" type="time" defaultValue={activity.endTime} required />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={activity.description} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                           {pending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                 </form>
            </DialogContent>
        </Dialog>
    );
}

function AddItineraryForm({ trip, onUpdate }: { trip: Trip, onUpdate: () => void }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await addItineraryItemAction(trip.id, formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            formRef.current?.reset();
            onUpdate();
        } else {
             toast({ variant: "destructive", title: "Error", description: result.message });
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

function AddCostForm({ trip, allUsers, onUpdate }: { trip: Trip, allUsers: User[], onUpdate: () => void }) {
    const { pending } = useFormStatus();
    const addCostItemWithTripId = addCostItemAction.bind(null, trip.id);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form ref={formRef} action={async (formData) => {
            await addCostItemWithTripId(formData);
            formRef.current?.reset();
            onUpdate();
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

function AddSuggestionForm({ tripId, onUpdate }: { tripId: number, onUpdate: () => void }) {
    const { pending } = useFormStatus();
    const addSuggestionWithId = addTripSuggestionAction.bind(null, tripId);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form ref={formRef} action={async (formData) => {
            await addSuggestionWithId(formData);
            formRef.current?.reset();
            onUpdate();
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

function DayScheduleView({ activities, tripId, canManageTrip, onUpdate }: { activities: ItineraryActivity[], tripId: number, canManageTrip: boolean, onUpdate: () => void }) {
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23
    const { toast } = useToast();

    const timeToMinutes = (time: string) => {
        if (!time || !time.includes(':')) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    const handleDelete = async (activityId: number) => {
        const result = await deleteItineraryItemAction(tripId, activityId);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            onUpdate();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
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
            {activities.map((activity) => {
                const startMinutes = timeToMinutes(activity.startTime);
                const endMinutes = timeToMinutes(activity.endTime);
                const duration = Math.max(0, endMinutes - startMinutes);
                
                return (
                    <div 
                        key={activity.id} 
                        className="absolute left-12 right-0 p-2 rounded-lg bg-accent text-accent-foreground shadow group"
                        style={{
                            top: `${startMinutes}px`,
                            height: `${duration}px`,
                        }}
                    >
                        <div className="flex justify-between items-start">
                           <div>
                               <p className="font-semibold text-sm">{activity.description}</p>
                               <p className="text-xs">{activity.startTime} - {activity.endTime}</p>
                           </div>
                           {canManageTrip && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                               <EditItineraryItemDialog tripId={tripId} activity={activity} onUpdate={onUpdate}>
                                     <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                               </EditItineraryItemDialog>
                               <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete this itinerary item.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(activity.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                               </AlertDialog>
                           </div>
                           )}
                       </div>
                    </div>
                );
            })}
        </div>
    );
}

function TripActionsCard({ trip, eventExists, onUpdate }: { trip: Trip, eventExists: boolean, onUpdate: () => void }) {
    const { toast } = useToast();
    const router = useRouter();

    const [publishState, publishFormAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createEventFromTripAction(formData);
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            onUpdate();
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
    const { pending: isPublishing } = useFormStatus();
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Trip Actions</CardTitle>
            </CardHeader>
             <CardContent>
                {eventExists ? (
                     <Button className="w-full" variant="outline" asChild>
                        <a href="/events">View Event</a>
                    </Button>
                ) : (
                    <form action={publishFormAction}>
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
                         <Button type="submit" className="w-full" disabled={isPublishing}>
                            {isPublishing ? 'Publishing...' : 'Publish to Events'}
                        </Button>
                    </form>
                )}
             </CardContent>
        </Card>
    );
}

export function TripDetailsClientPage({ user, trip: initialTrip, allUsers, eventExists: initialEventExists }: { user: User; trip: Trip, allUsers: User[], eventExists: boolean }) {
    const [trip, setTrip] = useState(initialTrip);
    const [eventExists, setEventExists] = useState(initialEventExists);
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleUpdate = async () => {
        const res = await fetch(`/api/trips/${trip.id}`);
        const updatedTrip = await res.json();
        setTrip(updatedTrip);

        const eventRes = await fetch('/api/events');
        const allEvents = await eventRes.json();
        setEventExists(allEvents.some((e: any) => e.tripId === trip.id));
    }

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
                                        {trip.itinerary.map((day) => (
                                            <div key={day.day}>
                                                <h3 className="font-semibold text-lg mb-4 border-b pb-2">{formatDate(day.day)}</h3>
                                                <div className="relative overflow-y-auto max-h-[600px] pr-2">
                                                <DayScheduleView activities={day.activities} tripId={trip.id} canManageTrip={canManageTrip} onUpdate={handleUpdate}/>
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
                     {canManageTrip && <TripActionsCard trip={trip} eventExists={eventExists} onUpdate={handleUpdate} /> }

                    {user.role === 'parent' ? (
                        <AddSuggestionForm tripId={trip.id} onUpdate={handleUpdate} />
                    ) : (
                       <>
                        <AddItineraryForm trip={trip} onUpdate={handleUpdate} />
                        <AddCostForm trip={trip} allUsers={allUsers} onUpdate={handleUpdate} />
                       </>
                    )}
                </div>
            </div>
        </AppShell>
    );
}


'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, createLinkAction, rateLinkAction, getLinksAction } from '@/app/actions';
import { getTrips, getEvents } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User, Trip, Link as LinkType, Event } from '@/lib/types';
import { PlusCircle, Star, Link as LinkIcon, ExternalLink, Filter, Plane, Calendar } from 'lucide-react';

function AddLinkDialog({ trips, events }: { trips: Trip[], events: Event[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createLinkAction(formData);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setOpen(false);
            formRef.current?.reset();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        return result;
    }, { success: false, message: ''});
    const { pending } = useFormStatus();

    const groupEvents = events.filter(e => e.type === 'group');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Link
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form action={formAction} ref={formRef}>
                    <DialogHeader>
                        <DialogTitle>Add a New Link</DialogTitle>
                        <DialogDescription>Share a useful link with the group.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input id="url" name="url" type="url" placeholder="https://example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="association">Associate with (Optional)</Label>
                             <Select name="association">
                                <SelectTrigger>
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectGroup>
                                        <SelectLabel>Trips</SelectLabel>
                                        {trips.map(trip => (
                                            <SelectItem key={`trip-${trip.id}`} value={`trip-${trip.id}`}>{trip.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel>Events</SelectLabel>
                                        {groupEvents.map(event => (
                                            <SelectItem key={`event-${event.id}`} value={`event-${event.id}`}>{event.title}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={pending}>{pending ? 'Adding...' : 'Add Link'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StarRating({ link, currentRating, onRate }: { link: LinkType, currentRating: number, onRate: (linkId: number, rating: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => onRate(link.id, star)}>
                    <Star
                        className={`h-5 w-5 cursor-pointer ${
                            star <= currentRating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-muted-foreground'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

function LinkCard({ link, user, trips, events, onRate }: { link: LinkType, user: User, trips: Trip[], events: Event[], onRate: (linkId: number, rating: number) => void }) {
    const associatedItem = link.association
        ? link.association.type === 'trip'
            ? { type: 'trip', data: trips.find(t => t.id === link.association.id) }
            : { type: 'event', data: events.find(e => e.id === link.association.id) }
        : null;

    const totalRating = link.ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = link.ratings.length > 0 ? totalRating / link.ratings.length : 0;
    const userRating = link.ratings.find(r => r.userId === user.id)?.rating || 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="max-w-[80%] break-words">{link.title}</CardTitle>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <ExternalLink className="h-5 w-5" />
                    </a>
                </div>
                <CardDescription>Added by {link.createdBy}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
                 {associatedItem && associatedItem.data && (
                    <div className="mt-4 text-xs inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-3 py-1">
                       {associatedItem.type === 'trip' ? <Plane className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                       <span>{associatedItem.data.name || associatedItem.data.title}</span>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({link.ratings.length} ratings)</span>
                </div>
                <StarRating link={link} currentRating={userRating} onRate={onRate} />
            </CardFooter>
        </Card>
    );
}

export default function LinkBoardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [links, setLinks] = useState<LinkType[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchLinks = async () => {
        const fetchedLinks = await getLinksAction();
        setLinks(fetchedLinks.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
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
                
                const [_, fetchedTrips, fetchedEvents] = await Promise.all([
                    fetchLinks(),
                    getTrips(),
                    getEvents()
                ]);
                setTrips(fetchedTrips);
                setEvents(fetchedEvents);

            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    
    const handleRate = async (linkId: number, rating: number) => {
        const result = await rateLinkAction(linkId, rating);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            await fetchLinks();
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

    const filteredLinks = links.filter(link => {
        if (filter === 'all') return true;
        if (filter === 'none') return !link.association;
        if (filter.startsWith('trip-')) {
            const tripId = Number(filter.split('-')[1]);
            return link.association?.type === 'trip' && link.association?.id === tripId;
        }
        if (filter.startsWith('event-')) {
            const eventId = Number(filter.split('-')[1]);
            return link.association?.type === 'event' && link.association?.id === eventId;
        }
        return false;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading links...</div>;
    }
    if (!user) {
        return <div>Redirecting...</div>
    }

    return (
        <AppShell user={user}>
            <PageHeader title="Link Board" description="A shared space for interesting links.">
                 <div className="flex items-center gap-2">
                    <div className="w-48">
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger>
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Show All</SelectItem>
                                <SelectItem value="none">Not Associated</SelectItem>
                                 <SelectGroup>
                                    <SelectLabel>Trips</SelectLabel>
                                    {trips.map(trip => (
                                        <SelectItem key={`trip-${trip.id}`} value={`trip-${trip.id}`}>{trip.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel>Events</SelectLabel>
                                    {events.filter(e => e.type === 'group').map(event => (
                                        <SelectItem key={`event-${event.id}`} value={`event-${event.id}`}>{event.title}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <AddLinkDialog trips={trips} events={events} />
                </div>
            </PageHeader>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredLinks.length > 0 ? (
                    filteredLinks.map(link => (
                        <LinkCard key={link.id} link={link} user={user} trips={trips} events={events} onRate={handleRate} />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">No links found</h3>
                        <p className="text-muted-foreground mb-4">
                           {filter === 'all' ? 'Get started by adding a new link.' : 'No links match the current filter.'}
                        </p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}

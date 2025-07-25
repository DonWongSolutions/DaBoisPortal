
'use client';

import { useEffect, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getEvents } from '@/lib/data.client';
import { getSessionAction, updateEventAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { Event, User } from '@/lib/types';
import { format } from 'date-fns';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Changes'}
        </Button>
    );
}

export default function EditEventPage() {
    const params = useParams();
    const eventId = Number(params.id);
    const [user, setUser] = useState<User | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser || sessionUser.role !== 'admin') {
                    redirect('/login');
                    return;
                }
                const allEvents = await getEvents();
                const currentEvent = allEvents.find(e => e.id === eventId);
                
                if (!currentEvent) {
                     redirect('/events');
                     return;
                }
                
                setUser(sessionUser);
                setEvent(currentEvent);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [eventId]);

    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (!user) {
        return <div>Redirecting...</div>
    }

    if (!event) {
        return <div>Event not found.</div>;
    }
  
    const updateEventWithId = updateEventAction.bind(null, event.id);
  
    return (
        <AppShell user={user}>
            <PageHeader
                title="Edit Event"
                description="Update the details for your event."
            />
            <div className="max-w-2xl mx-auto">
                <form action={updateEventWithId}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Event Title</Label>
                                <Input id="title" name="title" defaultValue={event.title} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" defaultValue={format(new Date(event.date), 'yyyy-MM-dd')} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={event.description} required />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isFamilyEvent" className="text-base">Family Event</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Is this event open to family members?
                                    </p>
                                </div>
                                <Switch id="isFamilyEvent" name="isFamilyEvent" defaultChecked={event.isFamilyEvent} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <SubmitButton />
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppShell>
    );
}

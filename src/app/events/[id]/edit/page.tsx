
'use client';

import { useEffect, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getEvents as getEventsClient } from '@/lib/data.client';
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
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser) {
                    redirect('/login');
                    return;
                }
                setUser(sessionUser);

                const allEvents = await getEventsClient();
                const currentEvent = allEvents.find(e => e.id === eventId);
                
                if (!currentEvent) {
                     redirect('/events');
                     return;
                }
                
                if (sessionUser.role === 'admin' || sessionUser.name === currentEvent.createdBy) {
                    setAuthorized(true);
                    setEvent(currentEvent);
                } else {
                    redirect('/events');
                }

            } catch (error) {
                console.error("Failed to fetch data:", error);
                 redirect('/events');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [eventId]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    
    if (!authorized || !event || !user) {
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>
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
                           {event.type === 'group' && (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isFamilyEvent" className="text-base">Family Event</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Is this event open to family members?
                                        </p>
                                    </div>
                                    <Switch id="isFamilyEvent" name="isFamilyEvent" defaultChecked={event.isFamilyEvent} />
                                </div>
                            )}
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

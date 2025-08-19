
'use client';

import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, createEventAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Event'}
        </Button>
    );
}

export default function NewEventPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [eventType, setEventType] = useState('group');

    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser || sessionUser.role === 'parent') {
                    redirect('/login');
                } else {
                    setUser(sessionUser);
                    if (sessionUser.role !== 'admin') {
                        setEventType('personal');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch session:", error);
                redirect('/login');
            } finally {
                setLoading(false);
            }
        }
        fetchSession();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
  
    if (!user) {
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
    }
  
    const pageTitle = "Create New Event";
    const pageDescription = "Schedule a group event or add a personal event to your calendar.";

    return (
        <AppShell user={user}>
            <PageHeader
                title={pageTitle}
                description={pageDescription}
            />
            <div className="max-w-2xl mx-auto">
                <form action={createEventAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {user.role === 'admin' && (
                                <div className="space-y-2">
                                    <Label>Event Type</Label>
                                    <RadioGroup name="eventType" defaultValue="group" onValueChange={setEventType}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="group" id="group" />
                                            <Label htmlFor="group">Group Event</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="personal" id="personal" />
                                            <Label htmlFor="personal">Personal Event</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            )}
                             <CardDescription>
                                {eventType === 'group' ? 'Create a new event for all members to respond to.' : 'Block out time on your personal schedule. Others will see you as "Busy" if marked private.'}
                            </CardDescription>

                            <div className="space-y-2">
                                <Label htmlFor="title">Event Title</Label>
                                <Input id="title" name="title" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" required />
                            </div>
                            
                            {eventType === 'group' && user.role === 'admin' && (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isFamilyEvent" className="text-base">Family Event</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Is this event open to family members?
                                        </p>
                                    </div>
                                    <Switch id="isFamilyEvent" name="isFamilyEvent" />
                                </div>
                            )}

                             {eventType === 'personal' && (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isPrivate" className="text-base">Private Event</Label>
                                        <p className="text-sm text-muted-foreground">
                                           If checked, others will only see "Busy" on the schedule.
                                        </p>
                                    </div>
                                    <Switch id="isPrivate" name="isPrivate" />
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


'use client';

import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { createEventAction } from '@/app/actions';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

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

    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser) {
                    redirect('/login');
                } else {
                    setUser(sessionUser);
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
        return <div>Loading...</div>;
    }
  
    if (!user) {
        return <div>Error loading page. Please try logging in again.</div>;
    }
  
    return (
        <AppShell user={user}>
            <PageHeader
                title="Create New Event"
                description="Fill out the details for your new event."
            />
            <div className="max-w-2xl mx-auto">
                <form action={createEventAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                            <CardDescription>All fields are required.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isFamilyEvent" className="text-base">Family Event</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Is this event open to family members?
                                    </p>
                                </div>
                                <Switch id="isFamilyEvent" name="isFamilyEvent" />
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

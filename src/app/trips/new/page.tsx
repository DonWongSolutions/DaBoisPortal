
'use client';

import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction } from '@/app/actions';
import { getUsers } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { createTripAction } from '@/app/actions';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Trip'}
        </Button>
    );
}

export default function NewTripPage() {
    const [user, setUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser) {
                    redirect('/login');
                } else {
                    const users = await getUsers();
                    setUser(sessionUser);
                    setAllUsers(users);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                redirect('/login');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
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
                title="Plan a New Trip"
                description="Fill out the details for your new trip."
            />
            <div className="max-w-2xl mx-auto">
                <form action={createTripAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Trip Details</CardTitle>
                            <CardDescription>All fields are required.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Trip Name</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destination">Destination</Label>
                                <Input id="destination" name="destination" required />
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
                             <div className="space-y-2">
                                <Label>Attendees</Label>
                                <div className="space-y-2 rounded-lg border p-4">
                                    {allUsers.map(u => (
                                        <div key={u.id} className="flex items-center space-x-2">
                                            <Checkbox id={`attendee-${u.id}`} name="attendees" value={u.name} defaultChecked={u.name === user.name} />
                                            <Label htmlFor={`attendee-${u.id}`}>{u.name}</Label>
                                        </div>
                                    ))}
                                </div>
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

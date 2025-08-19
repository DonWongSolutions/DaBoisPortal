
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, createMemoryAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Memory'}
        </Button>
    );
}

export default function NewMemoryPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionUser = await getSessionAction();
                if (!sessionUser || sessionUser.role === 'parent') {
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
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
  
    if (!user) {
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
    }

    return (
        <AppShell user={user}>
            <PageHeader
                title="Create New Memory"
                description="Share a moment with the group."
            />
            <div className="max-w-2xl mx-auto">
                <form action={createMemoryAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Memory Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" required rows={5} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrls">Image URLs</Label>
                                <Textarea 
                                    id="imageUrls" 
                                    name="imageUrls" 
                                    rows={5}
                                    placeholder="Paste each image URL on a new line."
                                />
                                <p className="text-sm text-muted-foreground">
                                    To add images, upload them to <a href="https://upload.cc/" target="_blank" rel="noopener noreferrer" className="underline">upload.cc</a> and paste each image URL on a new line here.
                                </p>
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

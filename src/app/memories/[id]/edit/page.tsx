
'use client';

import { useEffect, useState } from 'react';
import { redirect, useParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSessionAction, getMemoryByIdAction, updateMemoryAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { User, Memory } from '@/lib/types';
import { format } from 'date-fns';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Changes'}
        </Button>
    );
}

export default function EditMemoryPage() {
    const params = useParams();
    const memoryId = Number(params.id);
    const [user, setUser] = useState<User | null>(null);
    const [memory, setMemory] = useState<Memory | null>(null);
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

                const currentMemory = await getMemoryByIdAction(memoryId);
                
                if (!currentMemory) {
                     redirect('/memories');
                     return;
                }
                
                if (sessionUser.role === 'admin' || sessionUser.name === currentMemory.createdBy) {
                    setAuthorized(true);
                    setMemory(currentMemory);
                } else {
                    redirect('/memories');
                }

            } catch (error) {
                console.error("Failed to fetch data:", error);
                 redirect('/memories');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [memoryId]);

     if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    
    if (!authorized || !memory || !user) {
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>
    }

    const updateMemoryWithId = updateMemoryAction.bind(null, memory.id);

    return (
        <AppShell user={user}>
            <PageHeader
                title="Edit Memory"
                description="Update the details for this memory."
            />
            <div className="max-w-2xl mx-auto">
                <form action={updateMemoryWithId}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Memory Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" defaultValue={memory.title} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" name="date" type="date" defaultValue={format(new Date(memory.date), 'yyyy-MM-dd')} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={memory.description} required rows={5} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrls">Image URLs</Label>
                                <Textarea 
                                    id="imageUrls" 
                                    name="imageUrls" 
                                    rows={5}
                                    defaultValue={memory.imageUrls.join('\n')}
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

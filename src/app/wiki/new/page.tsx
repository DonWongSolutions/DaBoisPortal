
'use client';

import { redirect, useRouter } from 'next/navigation';
import { useFormStatus, useActionState } from 'react-dom';
import { getSessionAction, createWikiPageAction } from '@/app/actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { AppShell } from '@/components/app-shell';


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create Page'}
        </Button>
    );
}

export default function NewWikiPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await createWikiPageAction(formData);
        if (result?.success === false) { // Check for explicit false
             toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        } else if (result?.success === true && result.slug) {
            router.push(`/wiki/${result.slug}/edit`);
        }
        return result;
    }, { success: true, message: ''});


    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionUser = await getSessionAction();
                const editableRoles: Array<User['role']> = ['admin', 'member'];
                if (!sessionUser || !editableRoles.includes(sessionUser.role) || sessionUser.name === 'Parents') {
                    redirect('/wiki');
                    return;
                }
                setUser(sessionUser);
            } catch (error) {
                console.error("Failed to fetch session:", error);
                redirect('/dashboard');
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
        return <div>Redirecting...</div>
    }
  
    return (
        <AppShell user={user}>
            <PageHeader
                title="Create New Wiki Page"
                description="Create a new page for the public wiki."
            />
            <div className="max-w-2xl">
                <form action={formAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Page Details</CardTitle>
                            <CardDescription>The slug will be used in the URL and cannot be changed.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Page Title</Label>
                                <Input id="title" name="title" required />
                            </div>
                           <div className="space-y-2">
                                <Label htmlFor="slug">Page Slug</Label>
                                <Input id="slug" name="slug" required placeholder="e.g., getting-started-guide" />
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

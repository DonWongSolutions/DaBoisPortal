
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { getSessionAction, updateUserAction } from '@/app/actions';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import type { User } from '@/lib/types';
import { format } from 'date-fns';

function ProfileForm({ user, onUserUpdate }: { user: User, onUserUpdate: (user: User) => void }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [openDialog, setOpenDialog] = useState(false);
    
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await updateUserAction(formData);
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            const updatedUser = await getSessionAction();
            if (updatedUser) {
                onUserUpdate(updatedUser);
            }
            if (formData.has('profilePictureUrl')) {
               setOpenDialog(false);
            }
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        }
        return result;
    }, { success: false, message: ''});


    return (
        <form action={formAction} ref={formRef}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Your Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.profilePictureUrl} data-ai-hint="user avatar" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Change Picture</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change Profile Picture</DialogTitle>
                                    <DialogDescription>
                                        To change your profile picture, please upload an image to <a href="https://upload.cc/" target="_blank" rel="noopener noreferrer" className="underline">upload.cc</a>, then paste the full image URL below.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor="profilePictureUrl">Image URL</Label>
                                    <Input id="profilePictureUrl" name="profilePictureUrl" defaultValue={user.profilePictureUrl} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Separator />
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" defaultValue={user.email} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" defaultValue={user.phone} required />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="birthday">Date of Birth</Label>
                        <Input id="birthday" name="birthday" type="date" defaultValue={format(new Date(user.birthday), 'yyyy-MM-dd')} required />
                    </div>
                     <Separator />
                     <p className="text-sm text-muted-foreground">Update your password. Leave blank to keep it unchanged.</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" name="password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" />
                        </div>
                     </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Save Changes</Button>
                </CardFooter>
            </Card>
        </form>
    );
}


export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const sessionUser = await getSessionAction();
            if (!sessionUser) {
                redirect('/login');
                return;
            }
            setUser(sessionUser);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            redirect('/login');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
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
                title="Your Profile"
                description="Manage your account details."
            />
            <div className="max-w-2xl mx-auto">
                <ProfileForm user={user} onUserUpdate={setUser} />
            </div>
        </AppShell>
    );
}

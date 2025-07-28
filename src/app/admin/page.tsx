
'use client';

import { useEffect, useState, useActionState } from 'react';
import { redirect } from 'next/navigation';
import { getSettings, getUsers } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateSettingsAction, getSessionAction, adminUpdateUserAction, resetPasswordAction } from '@/app/actions';
import type { User, AppSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

function EditUserDialog({ user, onUpdate }: { user: User, onUpdate: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    
    const [updateState, updateFormAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await adminUpdateUserAction(user.id, formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            onUpdate();
            setOpen(false);
        } else {
             toast({ variant: "destructive", title: "Error", description: result.message });
        }
        return result;
    }, { success: false, message: ''});
    
     const [resetState, resetFormAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await resetPasswordAction(user.id, formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            onUpdate();
        } else {
             toast({ variant: "destructive", title: "Error", description: result.message });
        }
        return result;
    }, { success: false, message: ''});
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm">Edit User</Button></DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Edit User: {user.name}</DialogTitle>
                    <DialogDescription>
                        Update the user's details or reset their password.
                    </DialogDescription>
                </DialogHeader>
                <form action={updateFormAction} className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" defaultValue={user.email} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" defaultValue={user.phone} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
                 <Separator />
                <form action={resetFormAction} className="space-y-4">
                     <div>
                         <Label htmlFor="password">Reset Password</Label>
                         <p className="text-sm text-muted-foreground pb-2">Enter a new password for the user.</p>
                         <Input id="password" name="password" type="password" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" variant="destructive">Reset Password</Button>
                    </DialogFooter>
                </form>

            </DialogContent>
        </Dialog>
    )
}

function UserManagement({ users, adminUser, onUpdate }: { users: User[], adminUser: User, onUpdate: () => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Email</TableHead>
                             <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.filter(u => u.id !== adminUser.id).map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.phone}</TableCell>
                                <TableCell className="text-right">
                                    <EditUserDialog user={user} onUpdate={onUpdate} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SettingsForm({ initialSettings }: { initialSettings: AppSettings }) {
    const { toast } = useToast();
    const [settings, setSettings] = useState(initialSettings);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);
    
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const newSettings = {
            maintenanceMode: formData.get('maintenanceMode') === 'on',
            loginImageUrl: formData.get('loginImageUrl') as string,
            dashboardBannerUrl: formData.get('dashboardBannerUrl') as string,
        };
        const result = await updateSettingsAction(newSettings);
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
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
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage general settings for the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="maintenance-mode" className="text-base">Maintenance Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Temporarily disable access to the portal for non-admins.
                            </p>
                        </div>
                        <Switch id="maintenance-mode" name="maintenanceMode" checked={settings.maintenanceMode} onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="loginImageUrl">Login Page Image URL</Label>
                        <Input id="loginImageUrl" name="loginImageUrl" value={settings.loginImageUrl} onChange={(e) => setSettings({...settings, loginImageUrl: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dashboardBannerUrl">Dashboard Banner Image URL</Label>
                        <Input id="dashboardBannerUrl" name="dashboardBannerUrl" value={settings.dashboardBannerUrl} onChange={(e) => setSettings({...settings, dashboardBannerUrl: e.target.value})} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Save Changes</Button>
                </CardFooter>
            </Card>
        </form>
    );
}

export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [key, setKey] = useState(0); // Key to force re-render

    async function fetchData() {
        setLoading(true);
        try {
            const sessionUser = await getSessionAction();
            if (!sessionUser || sessionUser.role !== 'admin') {
                redirect('/dashboard');
                return;
            }
            const [appSettings, users] = await Promise.all([getSettings(), getUsers()]);
            setUser(sessionUser);
            setSettings(appSettings);
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            redirect('/login');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        
        // Polling to keep settings up to date
        const interval = setInterval(async () => {
            const freshSettings = await getSettings();
            setSettings(freshSettings);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleUserUpdate = async () => {
       try {
            const users = await getUsers();
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to re-fetch users:", error);
        }
    }

    if (loading || !settings || !user) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
  
    return (
        <AppShell user={user}>
            <PageHeader
                title="Admin Settings"
                description="Manage the portal."
            />
            <div className="space-y-8 max-w-4xl mx-auto">
                 <SettingsForm initialSettings={settings} />
                <Separator />
                <UserManagement users={allUsers} adminUser={user} onUpdate={handleUserUpdate} />
            </div>
        </AppShell>
    );
}

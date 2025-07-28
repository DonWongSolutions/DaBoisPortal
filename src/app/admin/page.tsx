
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
import { updateSettingsAction, getSessionAction, adminUpdateUserAction } from '@/app/actions';
import type { User, AppSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

function SettingsForm({ settings, onSettingsChange }: { settings: AppSettings, onSettingsChange: (newSettings: AppSettings) => void }) {
    const { toast } = useToast();
    
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
            onSettingsChange(newSettings);
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
                        <Switch id="maintenance-mode" name="maintenanceMode" checked={settings.maintenanceMode} onCheckedChange={(checked) => onSettingsChange({...settings, maintenanceMode: checked})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="loginImageUrl">Login Page Image URL</Label>
                        <Input id="loginImageUrl" name="loginImageUrl" value={settings.loginImageUrl} onChange={(e) => onSettingsChange({...settings, loginImageUrl: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dashboardBannerUrl">Dashboard Banner Image URL</Label>
                        <Input id="dashboardBannerUrl" name="dashboardBannerUrl" value={settings.dashboardBannerUrl} onChange={(e) => onSettingsChange({...settings, dashboardBannerUrl: e.target.value})} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Save Changes</Button>
                </CardFooter>
            </Card>
        </form>
    );
}

function EditUserDialog({ user, children }: { user: User, children: React.ReactNode }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await adminUpdateUserAction(user.id, formData);
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form action={formAction}>
                    <DialogHeader>
                        <DialogTitle>Edit User: {user.name}</DialogTitle>
                        <DialogDescription>
                            Update the user's details or reset their password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" defaultValue={user.email} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" defaultValue={user.phone} required />
                        </div>
                        <Separator />
                        <div>
                             <Label htmlFor="password">New Password</Label>
                             <p className="text-sm text-muted-foreground pb-2">Leave blank to keep the current password.</p>
                             <Input id="password" name="password" type="password" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function UserManagement({ users, adminUser }: { users: User[], adminUser: User }) {
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
                                    <EditUserDialog user={user}>
                                        <Button variant="outline" size="sm">Edit User</Button>
                                    </EditUserDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user || !settings) {
        return <div>Error loading page. Please try logging in again.</div>;
    }
  
    return (
        <AppShell user={user}>
            <PageHeader
                title="Admin Settings"
                description="Manage the portal."
            />
            <div className="space-y-8 max-w-4xl mx-auto">
                <SettingsForm settings={settings} onSettingsChange={setSettings} />
                <Separator />
                <UserManagement users={allUsers} adminUser={user} />
            </div>
        </AppShell>
    );
}

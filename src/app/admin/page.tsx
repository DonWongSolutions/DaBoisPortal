
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useFormState } from 'react-dom';
import { getSession } from '@/lib/auth';
import { getSettings } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateSettingsAction } from '@/app/actions';
import type { User, AppSettings } from '@/lib/types';

function SettingsForm({ settings }: { settings: AppSettings }) {
    const { toast } = useToast();
    const [currentSettings, setCurrentSettings] = useState(settings);
    
    const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
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
                        <Switch id="maintenance-mode" name="maintenanceMode" defaultChecked={currentSettings.maintenanceMode} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="loginImageUrl">Login Page Image URL</Label>
                        <Input id="loginImageUrl" name="loginImageUrl" defaultValue={currentSettings.loginImageUrl} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dashboardBannerUrl">Dashboard Banner Image URL</Label>
                        <Input id="dashboardBannerUrl" name="dashboardBannerUrl" defaultValue={currentSettings.dashboardBannerUrl} />
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
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const sessionUser = await getSession();
            if (!sessionUser || sessionUser.role !== 'admin') {
                redirect('/dashboard');
                return;
            }
            const appSettings = await getSettings();
            setUser(sessionUser);
            setSettings(appSettings);
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading || !user || !settings) {
        return (
          <AppShell user={user!}> 
            <PageHeader title="Admin Settings" description="Manage the portal." />
            <p>Loading...</p>
          </AppShell>
        );
    }
  
    return (
        <AppShell user={user}>
            <PageHeader
                title="Admin Settings"
                description="Manage the portal."
            />
            <div className="max-w-2xl mx-auto">
                <SettingsForm settings={settings} />
            </div>
        </AppShell>
    );
}

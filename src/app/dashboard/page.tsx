
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getSession } from '@/lib/auth';
import { getEvents, getSettings } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Mail, Phone, Cake, Users } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }

  const settings = await getSettings();
  const allEvents = await getEvents();

  const upcomingEvents = allEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AppShell user={user}>
      <PageHeader 
        title={`Welcome, ${user.name}!`}
        description="Here's a quick overview of what's happening."
      />

      <div className="space-y-8">
        <Card className="overflow-hidden">
            <Image 
                src={settings.dashboardBannerUrl}
                alt="Dashboard Banner"
                width={1200}
                height={400}
                className="w-full h-auto object-cover"
                data-ai-hint="abstract texture"
            />
        </Card>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Info</CardTitle>
              <CardDescription>Your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://placehold.co/64x64.png`} data-ai-hint="user avatar" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-lg">{user.name}</p>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                      <Cake className="h-4 w-4" /> <span>Born on {formatDate(user.birthday)} ({user.age} years old)</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" /> <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4" /> <span>{user.phone}</span>
                  </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>A glance at what's next.</CardDescription>
            </CardHeader>
            <CardContent>
                {upcomingEvents.length > 0 ? (
                    <ul className="space-y-4">
                        {upcomingEvents.map(event => (
                            <li key={event.id} className="flex items-start gap-4">
                                <div className="flex flex-col items-center justify-center bg-accent text-accent-foreground rounded-md p-2 h-16 w-16">
                                    <span className="text-sm font-bold">{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</span>
                                    <span className="text-2xl font-bold">{new Date(event.date).getDate()}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{event.title}</p>
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                      {event.isFamilyEvent && <Users className="h-3 w-3" />}
                                      <span>Created by {event.createdBy}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                    <Check className="h-4 w-4" />
                                    <span>You're going</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No upcoming events. Time to plan something!</p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

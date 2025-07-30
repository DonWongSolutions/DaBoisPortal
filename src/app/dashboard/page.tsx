
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getEvents, getSettings, getTrips, getUsers, getWiseWords } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Check, Mail, Phone, Cake, Users, Plane, Calendar, ChevronsRight, Gift, Pin } from 'lucide-react';
import type { User, WiseWord } from '@/lib/types';
import { differenceInDays, format, nextDay } from 'date-fns';

function getNextBirthday(birthday: string) {
    const today = new Date();
    const birthDate = new Date(birthday);
    
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    return nextBirthday;
}

function PinnedQuotes({ wiseWords }: { wiseWords: WiseWord[] }) {
    if (wiseWords.length === 0) return null;

    return (
        <div className="md:hidden mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Pin className="h-5 w-5" />
                        Pinned Words of Wisdom
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {wiseWords.map(word => (
                        <blockquote key={word.id} className="border-l-2 pl-4 italic">
                           <p>"{word.phrase}"</p>
                           <footer className="text-sm text-muted-foreground not-italic mt-1">
                             ~ {word.author}
                             {word.context && ` (${word.context})`}
                           </footer>
                        </blockquote>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }

  const settings = await getSettings();
  const allEvents = await getEvents();
  const allTrips = await getTrips();
  const allUsers = await getUsers();
  const allWiseWords = await getWiseWords();

  const pinnedWiseWords = allWiseWords.filter(w => w.pinned);
  
  const memberUsers = allUsers.filter(u => u.role === 'member');
  const upcomingBirthdays = memberUsers.map(u => {
      const nextBirthday = getNextBirthday(u.birthday);
      const daysUntil = differenceInDays(nextBirthday, new Date());
      return { ...u, nextBirthday, daysUntil };
  }).sort((a,b) => a.daysUntil - b.daysUntil).slice(0, 4);


  const upcomingEvents = allEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
    
  const upcomingTrips = allTrips
    .filter(trip => new Date(trip.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 1);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startDate} - ${endDate}`;
  }

  return (
    <AppShell user={user}>
      <div
        className="relative w-full h-80 rounded-lg overflow-hidden mb-8"
        data-ai-hint="abstract texture"
      >
        <Image 
            src={settings.dashboardBannerUrl}
            alt="Dashboard Banner"
            fill
            className="object-cover"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-8">
            <PageHeader 
                title={`Welcome, ${user.name}!`}
                description="Here's a quick overview of what's happening."
                className="text-white !mb-0"
            />
        </div>
      </div>
      
      <div className="space-y-8">
        <PinnedQuotes wiseWords={pinnedWiseWords} />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Info</CardTitle>
                <CardDescription>Your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                      <AvatarImage src={user.profilePictureUrl} data-ai-hint="user avatar" />
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
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Birthday Countdown</CardTitle>
                    <CardDescription>Upcoming birthdays in the group.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {upcomingBirthdays.map(bUser => (
                            <li key={bUser.id} className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={bUser.profilePictureUrl} data-ai-hint="user avatar" />
                                    <AvatarFallback>{bUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{bUser.name}</p>
                                    <p className="text-xs text-muted-foreground">{format(bUser.nextBirthday, 'MMMM do')}</p>
                                </div>
                               </div>
                               <div className="text-right">
                                 <p className="font-bold text-lg">{bUser.daysUntil}</p>
                                 <p className="text-xs text-muted-foreground">days</p>
                               </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>A glance at what's next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> Events</h3>
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
                        <p className="text-muted-foreground text-center py-4">No upcoming events. Time to plan something!</p>
                    )}
                </div>
                <Separator />
                 <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2"><Plane className="h-4 w-4" /> Trips</h3>
                    {upcomingTrips.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingTrips.map(trip => (
                               <Card key={trip.id}>
                                  <CardHeader>
                                    <CardTitle>{trip.name}</CardTitle>
                                    <CardDescription>{trip.destination}</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate)}</p>
                                  </CardContent>
                                   <CardFooter>
                                     <Link href={`/trips/${trip.id}`} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            View Details <ChevronsRight className="ml-2 h-4 w-4" />
                                        </Button>
                                     </Link>
                                   </CardFooter>
                               </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No upcoming trips. Get planning!</p>
                    )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

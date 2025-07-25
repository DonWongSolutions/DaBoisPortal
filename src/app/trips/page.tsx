
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getTrips, getUsers } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, MapPin, Calendar, Users, ChevronsRight } from 'lucide-react';
import type { Trip, User } from '@/lib/types';

async function TripCard({ trip }: { trip: Trip }) {
    const allUsers = await getUsers();
    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startDate} - ${endDate}`;
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{trip.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1">
                    <MapPin className="h-4 w-4" /> {trip.destination}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{trip.attendees.length} members going</span>
                </div>
                 <div className="flex -space-x-2 overflow-hidden pt-2">
                    {trip.attendees.map(name => (
                         <Avatar key={name} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                            <AvatarImage src={allUsers.find(u => u.name === name)?.profilePictureUrl} data-ai-hint="user avatar" />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    ))}
                 </div>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" className="w-full" asChild>
                    <Link href={`/trips/${trip.id}`}>
                        View Details <ChevronsRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default async function TripsPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }
  const trips = (await getTrips()).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <AppShell user={user}>
      <PageHeader 
        title="Trip Planner"
        description="Collaborate on trip itineraries and budgets."
      >
        {user.role !== 'parent' && (
            <Button asChild>
                <Link href="/trips/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Plan a New Trip
                </Link>
            </Button>
        )}
      </PageHeader>

      {trips.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map(trip => (
                <TripCard key={trip.id} trip={trip} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <h3 className="text-2xl font-bold tracking-tight">No trips planned yet</h3>
            <p className="text-muted-foreground mb-4">
                {user.role !== 'parent' ? "Get started by planning a new trip." : "No trips have been planned yet."}
            </p>
            {user.role !== 'parent' && (
                <Button asChild>
                    <Link href="/trips/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Plan a New Trip
                    </Link>
                </Button>
            )}
        </div>
      )}
    </AppShell>
  );
}


import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTrips } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, MapPin, Calendar, Users, ChevronsRight } from 'lucide-react';
import type { Trip } from '@/lib/types';

function TripCard({ trip }: { trip: Trip }) {
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
                            <AvatarImage src={`https://placehold.co/32x32`} data-ai-hint="user avatar" />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    ))}
                 </div>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" className="w-full">
                    View Details <ChevronsRight className="ml-2 h-4 w-4" />
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
  const trips = await getTrips();

  return (
    <AppShell user={user}>
      <PageHeader 
        title="Trip Planner"
        description="Collaborate on trip itineraries and budgets."
      >
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Plan a New Trip
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
        ))}
        {trips.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center">No trips planned yet.</p>
        )}
      </div>
    </AppShell>
  );
}

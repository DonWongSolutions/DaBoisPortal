
'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { getSessionAction, deleteTripAction, getTrips } from '@/app/actions';
import { getUsers as getUsersClient } from '@/lib/data.client';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, MapPin, Calendar, Users, ChevronsRight, Trash2 } from 'lucide-react';
import type { Trip, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function TripCard({ trip, allUsers, user, onDelete }: { trip: Trip; allUsers: User[]; user: User; onDelete: () => void }) {
    const { toast } = useToast();
    
    const [state, formAction] = useActionState(async (prevState:any, formData: FormData) => {
        const result = await deleteTripAction(trip.id);
        if (result.success) {
            toast({ title: "Success", description: "Trip deleted successfully."});
            onDelete();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
        return result;
    }, {success: false, message: ''});


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
                    {trip.attendees.map(name => {
                        const attendeeUser = allUsers.find(u => u.name === name);
                        return (
                         <Avatar key={name} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                            <AvatarImage src={attendeeUser?.profilePictureUrl} data-ai-hint="user avatar" />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        )
                    })}
                 </div>
            </CardContent>
            <CardFooter className="gap-2">
                 <Button variant="outline" className="w-full" asChild>
                    <Link href={`/trips/${trip.id}`}>
                        View Details <ChevronsRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                {user.role === 'admin' && (
                     <form action={formAction}>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the trip "{trip.name}" and any associated events. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Button type="submit">Yes, delete trip</Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </form>
                )}
            </CardFooter>
        </Card>
    )
}

export default function TripsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTripsAndUsers = async () => {
    try {
        const [sessionUser, users, tripsData] = await Promise.all([
            getSessionAction(),
            getUsersClient(),
            getTrips()
        ]);

        if (!sessionUser) {
            redirect('/login');
            return;
        }

        setUser(sessionUser);
        setAllUsers(users);
        setTrips(tripsData.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    } catch (error) {
        console.error("Failed to fetch data:", error);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchTripsAndUsers();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

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
                <TripCard key={trip.id} trip={trip} allUsers={allUsers} user={user} onDelete={fetchTripsAndUsers} />
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

    
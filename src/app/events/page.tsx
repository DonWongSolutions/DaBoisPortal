
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, PlusCircle, Users, User, CheckCircle, XCircle, HelpCircle, MoreHorizontal, Lightbulb, UserX, Plane, Trash2 } from 'lucide-react';
import type { Event, User as TUser, UserAvailability } from '@/lib/types';
import { EventResponseForm, ImportCalendarForm, SuggestionForm } from './event-actions';
import { Separator } from '@/components/ui/separator';
import { getSessionAction, deleteEventAction } from '@/app/actions';
import { getEvents as getEventsClient } from '@/lib/data.client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function AvailabilityBadge({ status }: { status: UserAvailability }) {
    const statusMap = {
        yes: { icon: CheckCircle, color: 'text-green-500', label: 'Going' },
        no: { icon: XCircle, color: 'text-red-500', label: 'Not Going' },
        maybe: { icon: HelpCircle, color: 'text-yellow-500', label: 'Maybe' },
        pending: { icon: MoreHorizontal, color: 'text-muted-foreground', label: 'Pending' },
    };
    const { icon: Icon, color, label } = statusMap[status];
    return <Icon className={`h-5 w-5 ${color}`} title={label} />;
}

function EventCard({ event, user, onDelete }: { event: Event, user: TUser, onDelete: (eventId: number) => void }) {
    const eventDate = new Date(event.date);
    const now = new Date();
    eventDate.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const isPast = eventDate < now;
    const canManage = user.role === 'admin' || user.name === event.createdBy;
    
    let badge;
    if (event.tripId) {
        badge = <Badge variant="secondary"><Plane className="mr-1 h-3 w-3" /> Trip</Badge>;
    } else if (event.type === 'personal') {
        badge = <Badge variant="secondary"><UserX className="mr-1 h-3 w-3" /> Personal</Badge>;
    } else if (event.isFamilyEvent) {
        badge = <Badge variant="secondary"><Users className="mr-1 h-3 w-3" /> Family</Badge>;
    } else {
        badge = <Badge variant="secondary"><User className="mr-1 h-3 w-3" /> Group</Badge>;
    }

    return (
        <Card className={`flex flex-col ${isPast ? 'opacity-60' : ''}`}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                    </div>
                     {badge}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.type === 'group' && (
                    <>
                        <div className="mt-4 text-sm font-medium">Who's going?</div>
                        <div className="flex flex-wrap gap-6 mt-2">
                            {Object.entries(event.responses).map(([name, status]) => (
                                <div key={name} className="flex flex-col items-center gap-1">
                                <AvailabilityBadge status={status as UserAvailability} />
                                    <span className="text-xs text-muted-foreground">{name}</span>
                                </div>
                            ))}
                        </div>
                    </>
                 )}
                 {event.suggestions && event.suggestions.length > 0 && (
                    <div className="mt-4">
                        <Separator className="my-4" />
                        <h4 className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Suggestions</h4>
                        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                            {event.suggestions.map((s, i) => (
                                <p key={i}><strong>{s.suggestedBy}:</strong> {s.suggestion}</p>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 border-t pt-4">
               {user.role !== 'parent' && event.type === 'group' && (
                 <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Response</h4>
                    <EventResponseForm eventId={event.id} currentResponse={event.responses[user.name] as UserAvailability} />
                 </div>
               )}
               {user.role === 'parent' && event.type === 'group' && (
                <div className="w-full">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Suggest an Edit</h4>
                    <SuggestionForm eventId={event.id} />
                </div>
               )}

               {event.tripId && (
                    <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href={`/trips/${event.tripId}`}>
                            <Plane className="mr-2 h-4 w-4" />
                            View Trip Details
                        </Link>
                    </Button>
               )}
               
                {canManage && event.type === 'group' && (
                     <div className="flex w-full gap-2 mt-2">
                        <Button variant="outline" size="sm" asChild className="w-full">
                            <Link href={`/events/${event.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Event
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the event "{event.title}". This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(event.id)}>
                                        Yes, delete event
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                )}
            </CardFooter>
        </Card>
    )
}

export default function EventsPage() {
    const [user, setUser] = useState<TUser | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    async function fetchEventsAndSession() {
        try {
            const sessionUser = await getSessionAction();
            if (!sessionUser) {
                redirect('/login');
                return;
            }
            setUser(sessionUser);

            const allEvents = await getEventsClient();
            const userVisibleEvents = allEvents.filter(event => 
                event.type === 'group' || (event.type === 'personal' && event.createdBy === sessionUser.name)
            ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setEvents(userVisibleEvents);

        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEventsAndSession();
    }, []);

    const handleDelete = async (eventId: number) => {
        const result = await deleteEventAction(eventId);
        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            // Re-fetch events to update the list
            fetchEventsAndSession();
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        }
    }

  if (loading) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
      return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <AppShell user={user}>
      <PageHeader 
        title="Events"
        description="Schedule, view, and respond to events."
      >
        {user.role !== 'parent' && (
            <div className="flex items-center gap-2">
               {user.role === 'admin' && <ImportCalendarForm />}
                <Button asChild>
                    <Link href="/events/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {user.role === 'admin' ? 'Create Event' : 'Add Personal Event'}
                    </Link>
                </Button>
            </div>
        )}
      </PageHeader>
      
      {events.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
              <EventCard key={event.id} event={event} user={user} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <h3 className="text-2xl font-bold tracking-tight">No events yet</h3>
            <p className="text-muted-foreground mb-4">
                {user.role === 'admin' ? "Get started by creating a new event or importing a calendar." : "No events have been created yet."}
            </p>
             {user.role !== 'parent' && (
                <div className="flex items-center gap-2">
                    {user.role === 'admin' && <ImportCalendarForm />}
                    <Button asChild>
                        <Link href="/events/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                             {user.role === 'admin' ? 'Create Event' : 'Add Personal Event'}
                        </Link>
                    </Button>
                </div>
            )}
        </div>
      )}
    </AppShell>
  );
}

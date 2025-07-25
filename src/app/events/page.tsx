
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getEvents } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, PlusCircle, Users, User, CheckCircle, XCircle, HelpCircle, MoreHorizontal, MessageSquare, Lightbulb } from 'lucide-react';
import type { Event, User as TUser, UserAvailability } from '@/lib/types';
import { EventResponseForm, ImportCalendarForm, SuggestionForm } from './event-actions';
import { Separator } from '@/components/ui/separator';

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

function EventCard({ event, user }: { event: Event, user: TUser }) {
    const eventDate = new Date(event.date);
    const now = new Date();
    eventDate.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const isPast = eventDate < now;
    
    return (
        <Card className={`flex flex-col ${isPast ? 'opacity-60' : ''}`}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                    </div>
                     {event.isFamilyEvent ? <Badge variant="secondary"><Users className="mr-1 h-3 w-3" /> Family</Badge> : <Badge variant="secondary"><User className="mr-1 h-3 w-3" /> Personal</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{event.description}</p>
                 <div className="mt-4 text-sm font-medium">Who's going?</div>
                 <div className="flex flex-wrap gap-6 mt-2">
                    {Object.entries(event.responses).map(([name, status]) => (
                        <div key={name} className="flex flex-col items-center gap-1">
                           <AvailabilityBadge status={status as UserAvailability} />
                            <span className="text-xs text-muted-foreground">{name}</span>
                        </div>
                    ))}
                </div>
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
               {user.role !== 'parent' ? (
                 <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Response</h4>
                    <EventResponseForm eventId={event.id} currentResponse={event.responses[user.name] as UserAvailability} />
                 </div>
               ) : (
                <div className="w-full">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Suggest an Edit</h4>
                    <SuggestionForm eventId={event.id} />
                </div>
               )}

                {user.role === 'admin' && (
                     <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href={`/events/${event.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Event
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

export default async function EventsPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }
  const events = (await getEvents()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AppShell user={user}>
      <PageHeader 
        title="Events"
        description="Schedule, view, and respond to events."
      >
        {user.role !== 'parent' && (
            <div className="flex items-center gap-2">
               <ImportCalendarForm />
                <Button asChild>
                    <Link href="/events/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Event
                    </Link>
                </Button>
            </div>
        )}
      </PageHeader>
      
      {events.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
              <EventCard key={event.id} event={event} user={user} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <h3 className="text-2xl font-bold tracking-tight">No events yet</h3>
            <p className="text-muted-foreground mb-4">
                {user.role !== 'parent' ? "Get started by creating a new event or importing a calendar." : "No events have been created yet."}
            </p>
             {user.role !== 'parent' && (
                <div className="flex items-center gap-2">
                    <ImportCalendarForm />
                    <Button asChild>
                        <Link href="/events/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Event
                        </Link>
                    </Button>
                </div>
            )}
        </div>
      )}
    </AppShell>
  );
}

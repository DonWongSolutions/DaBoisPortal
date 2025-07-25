
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getEvents } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Users, User, CheckCircle, XCircle, HelpCircle, MoreHorizontal } from 'lucide-react';
import type { Event, UserAvailability } from '@/lib/types';

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

function EventCard({ event }: { event: Event }) {
    const eventDate = new Date(event.date);
    const now = new Date();
    // Set hours to 0 to compare dates only
    eventDate.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const isPast = eventDate < now;
    
    return (
        <Card className={isPast ? 'opacity-60' : ''}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                    </div>
                    {event.isFamilyEvent ? <Badge variant="secondary"><Users className="mr-1 h-3 w-3" /> Family</Badge> : <Badge variant="secondary"><User className="mr-1 h-3 w-3" /> Personal</Badge>}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{event.description}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className="text-sm font-medium">Who's going?</div>
                <div className="flex gap-6">
                    {Object.entries(event.responses).map(([name, status]) => (
                        <div key={name} className="flex flex-col items-center gap-1">
                           <AvailabilityBadge status={status as UserAvailability} />
                            <span className="text-xs text-muted-foreground">{name}</span>
                        </div>
                    ))}
                </div>
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
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Event
        </Button>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
            <EventCard key={event.id} event={event} />
        ))}
      </div>
    </AppShell>
  );
}


import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getEvents, getUsers } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@/lib/types';

function generateCalendarDays(year: number, month: number) {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Previous month's days
    const firstDayIndex = date.getDay();
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let x = firstDayIndex; x > 0; x--) {
        days.push({ day: prevLastDay - x + 1, isCurrentMonth: false });
    }

    // Current month's days
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
        days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }

    // Next month's days
    const lastDayIndex = new Date(year, month, lastDay).getDay();
    const nextDays = 7 - lastDayIndex - 1;
    for (let j = 1; j <= nextDays; j++) {
        days.push({ day: j, isCurrentMonth: false });
    }

    return days;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ScheduleCalendar({ events, year, month }: { events: Event[], year: number, month: number }) {
    const calendarDays = generateCalendarDays(year, month);
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">{monthName} {year}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center font-semibold text-muted-foreground text-sm">{day}</div>
                    ))}
                    {calendarDays.map((dayInfo, index) => {
                        const dayEvents = dayInfo.date ? events.filter(e => new Date(e.date).toDateString() === dayInfo.date?.toDateString()) : [];
                        const isClash = dayEvents.length > 1; // Simple clash detection
                        return (
                            <div key={index} className={`flex flex-col h-24 md:h-32 border rounded-md p-1.5 overflow-y-auto ${dayInfo.isCurrentMonth ? 'bg-background' : 'bg-muted/50'}`}>
                                <span className={`text-xs font-medium ${dayInfo.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>{dayInfo.day}</span>
                                <div className="mt-1 space-y-1 flex-grow">
                                    {dayEvents.map(event => (
                                        <div key={event.id} className={`p-1 rounded-md text-xs ${isClash ? 'bg-destructive text-destructive-foreground' : 'bg-accent text-accent-foreground'}`}>
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

export default async function SchedulePage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }

  const allEvents = await getEvents();
  const users = await getUsers();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const memberSchedules = users.map(member => ({
      name: member.name,
      events: allEvents.filter(event => event.responses[member.name] === 'yes')
  }));

  const tabs = [{name: "Main", events: allEvents}, ...memberSchedules];

  return (
    <AppShell user={user}>
      <PageHeader 
        title="Schedule"
        description="View member schedules and the main event calendar."
      />
      <Tabs defaultValue="Main" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
            {tabs.map(tab => (
                 <TabsTrigger key={tab.name} value={tab.name}>{tab.name}</TabsTrigger>
            ))}
        </TabsList>
        {tabs.map(tab => (
            <TabsContent key={tab.name} value={tab.name}>
                <ScheduleCalendar events={tab.events} year={currentYear} month={currentMonth} />
            </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}

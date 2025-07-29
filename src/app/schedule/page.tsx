
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getEvents, getUsers } from '@/lib/data';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Gift } from 'lucide-react';

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

function ScheduleCalendar({ events, year, month, currentUser }: { events: Event[], year: number, month: number, currentUser: User }) {
    const calendarDays = generateCalendarDays(year, month);
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">{monthName} {year}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-px bg-border border-l border-t">
                    {weekDays.map(day => (
                        <div key={day} className="text-center font-semibold text-muted-foreground text-sm py-2 bg-muted/50 border-r border-b">{day}</div>
                    ))}
                    {calendarDays.map((dayInfo, index) => {
                        const dayEvents = dayInfo.date ? events.filter(e => new Date(e.date).toDateString() === dayInfo.date?.toDateString()) : [];
                        const isClash = dayEvents.length > 1; // Simple clash detection
                        return (
                            <div key={index} className={cn(
                                "relative flex flex-col min-h-[120px] p-1.5 overflow-y-auto border-r border-b",
                                dayInfo.isCurrentMonth ? 'bg-background' : 'bg-muted/50'
                            )}>
                                <span className={cn(
                                    "text-xs font-medium",
                                    dayInfo.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                                )}>{dayInfo.day}</span>
                                <div className="mt-1 space-y-1 flex-grow">
                                    {dayEvents.map(event => {
                                        const isCreator = event.createdBy === currentUser.name;
                                        const eventTitle = (event.type === 'personal' && event.isPrivate && !isCreator) ? "Busy" : event.title;
                                        const colorClass = event.color || (
                                            isClash && event.type === 'group' ? 'bg-destructive text-destructive-foreground' : 'bg-accent text-accent-foreground'
                                        );
                                        
                                        return (
                                          <div key={event.id} className={cn(
                                              "p-1 rounded-md text-xs flex items-center gap-1",
                                              colorClass,
                                              event.type === 'personal' && 'bg-purple-200 text-purple-800'
                                          )}>
                                              {event.type === 'birthday' && <Gift className="h-3 w-3" />}
                                              <span>{eventTitle}</span>
                                          </div>
                                        )
                                    })}
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
  const users = await getUsers().then(u => u.filter(user => user.role !== 'parent'));
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const birthdayEvents: Event[] = users.flatMap(member => {
    const birthDate = new Date(member.birthday);
    const events: Event[] = [];
    // Birthday for current year
    events.push({
      id: member.id + 1000,
      title: `${member.name}'s Birthday`,
      date: new Date(currentYear, birthDate.getMonth(), birthDate.getDate()).toISOString().split('T')[0],
      description: `It's ${member.name}'s birthday!`,
      isFamilyEvent: false,
      type: 'birthday',
      createdBy: 'system',
      responses: {},
      color: 'bg-pink-200 text-pink-800'
    });
    // Birthday for next year if we are in December
    if (currentMonth === 11) {
         events.push({
            id: member.id + 2000,
            title: `${member.name}'s Birthday`,
            date: new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate()).toISOString().split('T')[0],
            description: `It's ${member.name}'s birthday!`,
            isFamilyEvent: false,
            type: 'birthday',
            createdBy: 'system',
            responses: {},
            color: 'bg-pink-200 text-pink-800'
        });
    }
    return events;
  });
  
  const memberSchedules = users.map(member => ({
      name: member.name,
      events: allEvents.filter(event => {
          if (event.type === 'group') {
              return event.responses[member.name] === 'yes';
          }
          if (event.type === 'personal') {
             return event.createdBy === member.name;
          }
          return false;
      })
  }));

  const mainScheduleEvents = allEvents.filter(event => {
      // Show all group events and all personal events on the main schedule
      if(event.type === 'group') return true;
      if(event.type === 'personal') return true;
      return false;
  });

  const combinedMainEvents = [...mainScheduleEvents, ...birthdayEvents];

  const tabs = [{name: "Main", events: combinedMainEvents}, ...memberSchedules];
  
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();


  return (
    <AppShell user={user}>
      <PageHeader 
        title="Schedule"
        description="View member schedules and the main event calendar."
      />
      <Tabs defaultValue="Main" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
            {tabs.map(tab => (
                 <TabsTrigger key={tab.name} value={tab.name}>{tab.name}</TabsTrigger>
            ))}
        </TabsList>
        {tabs.map(tab => (
            <TabsContent key={tab.name} value={tab.name}>
                <div className="space-y-8">
                    <ScheduleCalendar events={tab.events} year={currentYear} month={currentMonth} currentUser={user} />
                    <ScheduleCalendar events={tab.events} year={nextMonthYear} month={nextMonth} currentUser={user} />
                </div>
            </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}

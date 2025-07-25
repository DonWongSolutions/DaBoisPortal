
export interface User {
  id: number;
  name: 'Don' | 'Isaac' | 'Xavier' | 'Nathan';
  password?: string;
  role: 'admin' | 'member';
  age: number;
  birthday: string;
  phone: string;
  email: string;
}

export type UserAvailability = 'yes' | 'no' | 'maybe' | 'pending';

export interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  isFamilyEvent: boolean;
  createdBy: string;
  responses: Record<string, UserAvailability>;
}

export interface ItineraryActivity {
  time: string;
  description: string;
}

export interface ItineraryDay {
  day: string;
  activities: ItineraryActivity[];
}

export interface TripCost {
  id: number;
  item: string;
  amount: number;
  paidBy: string;
}

export interface Trip {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  attendees: string[];
  itinerary: ItineraryDay[];
  costs: TripCost[];
}

export interface AppSettings {
    maintenanceMode: boolean;
    loginImageUrl: string;
    dashboardBannerUrl: string;
}

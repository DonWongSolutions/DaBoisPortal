

export interface User {
  id: number;
  name: 'Don' | 'Isaac' | 'Xavier' | 'Nathan' | 'Parents';
  password?: string;
  role: 'admin' | 'member' | 'parent';
  age: number;
  birthday: string;
  phone: string;
  email: string;
  profilePictureUrl?: string;
}

export type UserAvailability = 'yes' | 'no' | 'maybe' | 'pending';

export interface EventSuggestion {
  suggestedBy: string;
  suggestion: string;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  isFamilyEvent: boolean;
  type: 'group' | 'personal';
  createdBy: string;
  responses: Record<string, UserAvailability>;
  suggestions?: EventSuggestion[];
  isPrivate?: boolean;
  tripId?: number;
}

export interface ItineraryActivity {
  startTime: string;
  endTime: string;
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
  suggestions?: { suggestedBy: string; suggestion: string }[];
}

export interface AppSettings {
    maintenanceMode: boolean;
    loginImageUrl: string;
    dashboardBannerUrl: string;
}

export interface LinkRating {
    userId: number;
    rating: number;
}

export interface Link {
    id: number;
    url: string;
    title: string;
    description: string;
    tags?: string[];
    createdBy: string;
    createdAt: string;
    ratings: LinkRating[];
}

export interface ChatMessage {
    id: number;
    author: string;
    text: string;
    timestamp: string;
}

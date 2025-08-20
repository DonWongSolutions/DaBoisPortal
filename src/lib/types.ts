

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
  forceInfoUpdate?: boolean;
  forcePasswordChange?: boolean;
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
  type: 'group' | 'personal' | 'birthday';
  createdBy: string;
  responses: Record<string, UserAvailability>;
  suggestions?: EventSuggestion[];
  isPrivate?: boolean;
  tripId?: number;
  color?: string;
}

export interface ItineraryActivity {
  id: number;
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

export interface MemoryComment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

export interface Memory {
  id: number;
  title: string;
  description: string;
  date: string;
  imageUrls: string[];
  createdBy: string;
  comments: MemoryComment[];
}

export type WiseWordCategory = 'Exotic' | 'Legendary' | 'Common';

export interface WiseWord {
  id: number;
  phrase: string;
  author: string;
  context?: string;
  addedBy: string;
  upvotes: number[];
  pinned: boolean;
  category: WiseWordCategory;
}

export interface Location {
    id: number;
    countryName: string;
    countryCode: string; // ISO 3166-1 alpha-2
    cityName?: string;
    latitude?: number;
    longitude?: number;
    startDate: string;
    endDate: string;
    visitedBy: string;
    geojson?: any;
}

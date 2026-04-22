export interface LoveLanguages {
  wordsOfAffirmation: number;
  actsOfService: number;
  receivingGifts: number;
  qualityTime: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  loveLanguages?: LoveLanguages;
  hobbies?: string[];
  partnerUid?: string;
  coupleId?: string;
  joinCode?: string;
  onboardingComplete?: boolean;
}

export interface DailyDate {
  id: string;
  title: string;
  description: string;
  category: string;
  loveLanguage: keyof LoveLanguages;
  date: string; // ISO string
  scratchedBy: string[]; // Array of UIDs
  suggestedTime?: string; // ISO string
  status: 'pending' | 'confirmed' | 'completed';
  photos?: string[]; // Base64 or IDs
  notes?: string;
  completedAt?: string;
}

export interface Ping {
  from: string;
  type: 'scratch' | 'plan';
  timestamp: any;
}

export interface Couple {
  id: string;
  partner1: string;
  partner2: string;
  dailyDate?: DailyDate;
  history?: DailyDate[];
  pings?: Ping[];
  createdAt: any;
}

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  loveLanguage: keyof LoveLanguages;
  longDistanceFriendly: boolean;
}

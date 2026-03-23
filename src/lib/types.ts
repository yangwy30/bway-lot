export interface Show {
  id: string;
  title: string;
  source: 'rush.telecharge' | 'broadwaydirect' | 'luckyseat';
  status: 'OPEN' | 'CLOSED' | 'UPCOMING';
  drawDate?: string;
  performanceDate: string;
  entryUrl: string;
  price?: number;
}

export interface Profile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  dob?: {
    month: string;
    day: string;
    year: string;
  };
  address?: string;
  city?: string;
  state?: string;
  telechargeEmail?: string;
  telechargePassword?: string;
}

export interface ContinuousEntryJob {
  id: string;
  showId: string;
  profileIds: string[];
  active: boolean; // if false, the user paused/opted-out of continuous entry
  createdAt: string;
}

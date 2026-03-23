import { Show } from '../show-data';

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

export interface EntryResult {
  showId: string;
  profileId: string;
  success: boolean;
  message: string;
  timestamp: string;
  screenshotPath?: string;
}

export interface Submitter {
  submitEntry(show: Show, profile: Profile): Promise<EntryResult>;
}

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
  isAlreadyEntered?: boolean;
  message: string;
  timestamp: string;
  screenshotPath?: string;
}

export interface Submitter {
  submitEntry(show: Show, profile: Profile, sessionId: string): Promise<EntryResult>;
  /** Optional: enter multiple shows in a single browser session (e.g. Telecharge shared dashboard). */
  submitEntries?(shows: Show[], profile: Profile, sessionId: string): Promise<EntryResult[]>;
}

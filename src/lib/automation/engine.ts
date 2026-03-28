import { Show } from '../show-data';
import { Profile, EntryResult, Submitter } from './types';
import { EmailService } from '../notifications/email';
import { logger } from '../logger';
import fs from 'fs';
import path from 'path';

export interface Enrollment {
  userId?: string;
  showId: string;
  profileIds: string[];
  active: boolean;
  autoReenroll: boolean;
}

const ENROLLMENTS_PATH = path.join(process.cwd(), 'data', 'enrollments.json');
const PROFILES_PATH = path.join(process.cwd(), 'data', 'profiles.json');
const ENTRY_LOG_PATH = path.join(process.cwd(), 'data', 'entry-log.json');

export interface EntryLogRecord extends EntryResult {
  userId?: string;
  showTitle: string;
  profileName: string;
  site: string;
}

declare global {
  var __automationSessionId: string | null;
}

export class AutomationEngine {
  public static get currentSessionId(): string | null {
    if (typeof global !== 'undefined') {
      return global.__automationSessionId || null;
    }
    return null;
  }

  public static set currentSessionId(val: string | null) {
    if (typeof global !== 'undefined') {
      global.__automationSessionId = val;
    }
  }

  public static stop() {
    AutomationEngine.currentSessionId = null;
    logger.log('🛑 Automation stop signal received. Invalidating current session...', 'warning');
  }

  public static startSession(): string {
    const sessionId = Math.random().toString(36).substring(7);
    AutomationEngine.currentSessionId = sessionId;
    return sessionId;
  }

  constructor() {
    this.ensureDataDir();
    this.setupTempDir();
  }

  private setupTempDir() {
    const tmpDir = path.join(process.cwd(), 'data', 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    // Direct Playwright and other tools to use our local writable temp folder
    process.env.TMPDIR = tmpDir;
    process.env.TEMP = tmpDir;
    process.env.TMP = tmpDir;
  }

  private getSubmitters(): Record<string, Submitter> {
    throw new Error("Use getSubmitter(name) instead");
  }

  async getSubmitter(site: string): Promise<Submitter> {
    if (site === 'BroadwayDirect') {
      const { BroadwayDirectSubmitter } = await import('./broadway-direct');
      return new BroadwayDirectSubmitter();
    } else if (site === 'LuckySeat') {
      const { LuckySeatSubmitter } = await import('./lucky-seat');
      return new LuckySeatSubmitter();
    } else if (site === 'Telecharge') {
      const { TelechargeSubmitter } = await import('./telecharge');
      return new TelechargeSubmitter();
    }
    throw new Error(`Unknown site: ${site}`);
  }

  private ensureDataDir() {
    const dir = path.dirname(ENROLLMENTS_PATH);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
  }

  async runBatchSubmission(show: Show, profiles: Profile[], sessionId: string): Promise<EntryResult[]> {
    const submitter = await this.getSubmitter(show.site);
    if (!submitter) {
      throw new Error(`No submitter found for site: ${show.site}`);
    }

    const results: EntryResult[] = [];
    const emailService = new EmailService();
    logger.log(`Starting batch for ${show.title} on ${show.site} with ${profiles.length} profiles`, 'info');

    for (const profile of profiles) {
      if (AutomationEngine.currentSessionId !== sessionId) {
        logger.log(`Session mismatch (${sessionId} !== ${AutomationEngine.currentSessionId}). Aborting batch for ${show.title}.`, 'warning');
        break;
      }
      try {
        const profileName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
        logger.log(`Starting working on ${profileName}...`, 'info');

        const result = await submitter.submitEntry(show, profile, sessionId);
        results.push(result);

        // Persist to entry log
        this.logEntry({
          ...result,
          userId: (profile as any).userId,
          showTitle: show.title,
          profileName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User',
          site: show.site
        });

        if (result.success) {
           if (AutomationEngine.currentSessionId !== sessionId) break;

           const profileName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
           const isAlready = result.message.toLowerCase().includes('already');
           
           if (isAlready) {
             logger.log(`ALREADY ENTERED: ${show.title} — ${profileName}`, 'info');
           } else {
             logger.log(`SUCCESS: ${show.title} — ${profileName}`, 'success');
             await emailService.sendEmail({
               to: profile.email || profile.telechargeEmail || '',
               subject: `Entered! 🎟️ ${show.title}`,
               html: emailService.generateEntryConfirmationHTML(show.title, profile.firstName || 'there')
             }).catch(err => logger.log(`Failed to send entry confirmation email: ${err}`, 'error'));
           }
        } else {
           if (AutomationEngine.currentSessionId === sessionId) {
             logger.log(`FAILED: ${show.title} — ${result.message}`, 'error');
           }
        }
      } catch (err: any) {
        logger.log(`Batch error for ${profile.firstName || 'User'}: ${err.message}`, 'error');
        results.push({
          showId: show.id,
          profileId: profile.id,
          success: false,
          message: `Batch error: ${err.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  // Enrollment Management
  getEnrollments(userId: string): Enrollment[] {
    if (!fs.existsSync(ENROLLMENTS_PATH)) return [];
    try {
      const all = JSON.parse(fs.readFileSync(ENROLLMENTS_PATH, 'utf-8')) as Enrollment[];
      return all.filter(e => e.userId === userId);
    } catch {
      return [];
    }
  }

  saveEnrollment(enrollment: Enrollment) {
    let all: Enrollment[] = [];
    if (fs.existsSync(ENROLLMENTS_PATH)) {
      try { all = JSON.parse(fs.readFileSync(ENROLLMENTS_PATH, 'utf-8')); } catch {}
    }
    
    const index = all.findIndex(e => e.showId === enrollment.showId && e.userId === enrollment.userId);
    if (index >= 0) {
      all[index] = enrollment;
    } else {
      all.push(enrollment);
    }

    fs.writeFileSync(ENROLLMENTS_PATH, JSON.stringify(all, null, 2));
  }

  // Profile Management
  getProfiles(userId: string): Profile[] {
    if (!fs.existsSync(PROFILES_PATH)) return [];
    try {
      const all = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8'));
      return all.filter((p: any) => p.userId === userId);
    } catch {
      return [];
    }
  }

  saveProfile(profile: Profile & { userId: string }) {
    let all: any[] = [];
    if (fs.existsSync(PROFILES_PATH)) {
      try { all = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8')); } catch {}
    }
    const index = all.findIndex(p => p.id === profile.id);
    
    if (index >= 0) {
      all[index] = profile;
    } else {
      all.push(profile);
    }
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(all, null, 2));
  }

  deleteProfile(id: string, userId: string) {
    let all: any[] = [];
    if (fs.existsSync(PROFILES_PATH)) {
      try { all = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8')); } catch {}
    }
    const filtered = all.filter(p => !(p.id === id && p.userId === userId));
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(filtered, null, 2));
  }

  // Entry Log Management
  private logEntry(record: EntryLogRecord) {
    let all: EntryLogRecord[] = [];
    if (fs.existsSync(ENTRY_LOG_PATH)) {
      try { all = JSON.parse(fs.readFileSync(ENTRY_LOG_PATH, 'utf-8')); } catch {}
    }
    all.unshift(record);
    const trimmed = all.slice(0, 5000); // 5000 max across all users
    fs.writeFileSync(ENTRY_LOG_PATH, JSON.stringify(trimmed, null, 2));
  }

  getEntryLog(userId: string): EntryLogRecord[] {
    if (!fs.existsSync(ENTRY_LOG_PATH)) return [];
    try {
      const all = JSON.parse(fs.readFileSync(ENTRY_LOG_PATH, 'utf-8')) as EntryLogRecord[];
      return all.filter(e => e.userId === userId);
    } catch {
      return [];
    }
  }
}

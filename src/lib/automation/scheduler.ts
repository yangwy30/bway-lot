import cron from 'node-cron';
import { AutomationEngine } from './engine';
import { getShows } from '../show-data';
import { EmailService } from '../notifications/email';
import fs from 'fs';
import path from 'path';

export function startScheduler() {
  const engine = new AutomationEngine();

  // Run every morning at 9:00 AM (typical lottery opening time)
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Running daily lottery enrollment check...');
    
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    if (!fs.existsSync(usersPath)) return;
    
    let users = [];
    try {
      users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    } catch (err) {
      console.error('[Scheduler] Error reading users:', err);
      return;
    }

    for (const user of users) {
      const userId = user.id;
      const enrollments = engine.getEnrollments(userId);
      const profiles = engine.getProfiles(userId);
      const emailService = new EmailService();
      const userResults: { showTitle: string; success: boolean; message: string }[] = [];

      // [Concern 4 fix] Start a proper session so session checks work correctly
      const sessionId = AutomationEngine.startSession();

      // Fetch live show data for this run
      const allShows = await getShows();
      
      // Separate Telecharge enrollments for multi-show optimization
      const telechargeEnrollments: typeof enrollments = [];
      const otherEnrollments: typeof enrollments = [];

      for (const enrollment of enrollments) {
        if (!enrollment.active || !enrollment.autoReenroll) continue;
        const show = allShows.find((s: any) => s.id === enrollment.showId);
        if (!show) continue;
        if (show.site === 'Telecharge') {
          telechargeEnrollments.push(enrollment);
        } else {
          otherEnrollments.push(enrollment);
        }
      }

      // Process Telecharge shows with optimized multi-show batch
      if (telechargeEnrollments.length > 0) {
        const showsWithProfiles: { show: any; profiles: any[] }[] = [];
        for (const enrollment of telechargeEnrollments) {
          const show = allShows.find((s: any) => s.id === enrollment.showId)!;
          const selectedProfiles = profiles.filter((p: any) => enrollment.profileIds.includes(p.id));
          if (selectedProfiles.length > 0) {
            showsWithProfiles.push({ show, profiles: selectedProfiles });
          }
        }
        if (showsWithProfiles.length > 0) {
          const batchResults = await engine.runTelechargeMultiShowBatch(showsWithProfiles, sessionId);
          for (const res of batchResults) {
            const matchedShow = allShows.find((s: any) => s.id === res.showId);
            userResults.push({
              showTitle: matchedShow?.title || res.showId,
              success: res.success,
              message: res.message
            });
          }
        }
      }

      // Process non-Telecharge shows with standard per-show flow
      for (const enrollment of otherEnrollments) {
        const show = allShows.find((s: any) => s.id === enrollment.showId);
        if (!show) continue;

        console.log(`[Scheduler] Checking ${show.title} for user ${user.username}...`);

        const selectedProfiles = profiles.filter((p: any) => enrollment.profileIds.includes(p.id));
        if (selectedProfiles.length > 0) {
          const batchResults = await engine.runBatchSubmission(show, selectedProfiles, sessionId);
          for (const res of batchResults) {
            userResults.push({
              showTitle: show.title,
              success: res.success,
              message: res.message
            });
          }
        }
      }

      if (userResults.length > 0) {
        console.log(`[Scheduler] Sending daily summary for ${user.username}.`);
        const primaryProfile = profiles[0];
        if (primaryProfile && primaryProfile.email) {
          await emailService.sendEmail({
            to: primaryProfile.email,
            subject: `Daily Lottery Summary: ${new Date().toLocaleDateString()}`,
            html: emailService.generateSummaryHTML(userResults)
          }).catch(err => console.error('[Scheduler] Failed to send summary email:', err));
        }
      }
    }
  });

  console.log('[Scheduler] Automation scheduler started.');
}

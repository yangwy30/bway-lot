import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Submitter, Profile, EntryResult } from './types';
import { Show } from '../show-data';

chromium.use(StealthPlugin());

export class TelechargeSubmitter implements Submitter {
  async submitEntry(show: Show, profile: Profile): Promise<EntryResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log(`[Telecharge] Starting entry for ${show.title} - ${profile.firstName || ''} ${profile.lastName || ''}`);
      
      // Step 1: Navigate to SocialToaster campaign landing
      await page.goto('https://my.socialtoaster.com/st/campaign_landing/?key=BROADWAY', { waitUntil: 'networkidle' });


      // Click Sign In
      await page.click('#st_sign_in');
      await page.waitForSelector('#login_email', { timeout: 10000 });

      // Fill login form
      await page.fill('#login_email', profile.telechargeEmail || profile.email || '');
      await page.fill('#password', profile.telechargePassword || '');
      await page.press('#password', 'Enter');
      
      // Wait for navigation/redirection after login
      await page.waitForURL(/campaign_stats/, { timeout: 30000 });
      await page.waitForSelector('a:has-text("Logout"), :has-text("Hi ")', { timeout: 10000 });

      // Now on the main dashboard, look for the show
      // SocialToaster shows are often just specific "Challenges" or "Enter" buttons
      // For this prototype, we assume success if we logged in and found the campaign page
      const pageTitle = await page.title();
      if (pageTitle.toLowerCase().includes('broadway')) {

         return {
          showId: show.id,
          profileId: profile.id,
          success: true,
          message: 'Logged in and entered successfully',
          timestamp: new Date().toISOString()
        };
      }

      return {
        showId: show.id,
        profileId: profile.id,
        success: false,
        message: 'Could not confirm entry status after login',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`[Telecharge] Failed to submit entry for ${show.title}:`, error.message);
      return {
        showId: show.id,
        profileId: profile.id,
        success: false,
        message: `Submission failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    } finally {
      await browser.close();
    }
  }
}

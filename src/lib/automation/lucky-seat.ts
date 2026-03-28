import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Submitter, Profile, EntryResult } from './types';
import { Show } from '../show-data';
import { AutomationEngine } from './engine';

import { logger } from '../logger';
import path from 'path';
import fs from 'fs';

chromium.use(StealthPlugin());

export class LuckySeatSubmitter implements Submitter {
  async submitEntry(show: Show, profile: Profile, sessionId: string): Promise<EntryResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      console.log(`[LuckySeat] Starting entry for ${show.title} - ${profile.firstName || ''} ${profile.lastName || ''}`);
      await page.goto(show.link, { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

      // Discover all "ENTER" buttons
      const enterButtons = await page.locator('button:has-text("ENTER"), a:has-text("ENTER"), .lottery-entry-button').all();
      
      if (enterButtons.length === 0) {
        // Maybe it's already on the form?
        if (await page.locator('input[name="email"]').isVisible()) {
          await this.fillLuckySeatForm(page, profile);
          return { showId: show.id, profileId: profile.id, success: true, message: 'Entered (direct form)', timestamp: new Date().toISOString() };
        }
        throw new Error('No open lottery buttons found');
      }

      logger.log(`[LuckySeat] Found ${enterButtons.length} potential entries.`, 'info');
      let successCount = 0;
      let alreadyEnteredCount = 0;
      
      for (let i = 0; i < enterButtons.length; i++) {
        try {
          // Re-navigate or find buttons again if DOM changes
          const currentButtons = await page.locator('button:has-text("ENTER"), a:has-text("ENTER"), .lottery-entry-button').all();
          if (currentButtons[i]) {
            if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
            await currentButtons[i].click({ force: true });
            await page.waitForTimeout(2000);
            if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
            const entryResultMatch = await this.fillLuckySeatForm(page, profile);
            if (entryResultMatch === 'already') {
              alreadyEnteredCount++;
            } else {
              successCount++;
            }
            // Go back to the link to find the next performance
            if (i < enterButtons.length - 1) {
              await page.goto(show.link, { waitUntil: 'domcontentloaded' });
            }
          }
        } catch (e: any) {
          logger.log(`[LuckySeat] Failed entry index ${i}: ${e.message}`, 'error');
        }
      }

      return {
        showId: show.id,
        profileId: profile.id,
        success: successCount > 0 || alreadyEnteredCount > 0,
        isAlreadyEntered: successCount === 0 && alreadyEnteredCount > 0,
        message: successCount > 0
          ? `Successfully entered ${successCount} performance(s) for "${show.title}"${alreadyEnteredCount > 0 ? ` (${alreadyEnteredCount} already entered)` : ''}`
          : alreadyEnteredCount > 0
          ? `Already entered all available entries for "${show.title}"`
          : `No entries successful for "${show.title}"`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`[LuckySeat] Failed to submit entry for ${show.title}:`, error.message);
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

  private async fillLuckySeatForm(page: any, profile: Profile) {
    const emailField = page.locator('input[name="email"]');
    if (await emailField.isVisible()) {
      await emailField.fill(profile.email || '');
      await page.press('input[name="email"]', 'Enter');
      await page.waitForTimeout(2000);
    }

    const firstNameField = page.locator('input[name="first_name"]');
    if (await firstNameField.isVisible()) {
      await firstNameField.fill(profile.firstName || '');
      await page.fill('input[name="last_name"]', profile.lastName || '');
      await page.fill('input[name="zip_code"]', profile.zipCode || '');
      
      const checkboxes = await page.$$('input[type="checkbox"]');
      for (const checkbox of checkboxes) {
          await checkbox.check().catch(() => {});
      }

      await page.click('button[type="submit"]');
      const responseMsg = await page.waitForSelector('.success-message, :has-text("received"), :has-text("Success"), :has-text("already")', { timeout: 15000 });
      logger.log(`SUCCESS: Logged into Lucky Seat for ${profile.firstName || profile.email}`, 'success');
      const text = await responseMsg.innerText();
      return text.toLowerCase().includes('already') ? 'already' : 'success';
    }
    return 'fail';
  }
}

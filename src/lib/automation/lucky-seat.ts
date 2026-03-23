import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Submitter, Profile, EntryResult } from './types';
import { Show } from '../show-data';

import { logger } from '../logger';
import path from 'path';
import fs from 'fs';

chromium.use(StealthPlugin());

export class LuckySeatSubmitter implements Submitter {
  async submitEntry(show: Show, profile: Profile): Promise<EntryResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log(`[LuckySeat] Starting entry for ${show.title} - ${profile.firstName || ''} ${profile.lastName || ''}`);
      await page.goto(show.link, { waitUntil: 'domcontentloaded', timeout: 60000 });

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
      
      for (let i = 0; i < enterButtons.length; i++) {
        try {
          // Re-navigate or find buttons again if DOM changes
          const currentButtons = await page.locator('button:has-text("ENTER"), a:has-text("ENTER"), .lottery-entry-button').all();
          if (currentButtons[i]) {
            await currentButtons[i].click({ force: true });
            await page.waitForTimeout(2000);
            await this.fillLuckySeatForm(page, profile);
            successCount++;
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
        success: successCount > 0,
        message: `Successfully entered ${successCount} lottery(ies)`,
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
      await page.waitForSelector('.success-message, :has-text("received"), :has-text("Success")', { timeout: 15000 });
    }
  }
}

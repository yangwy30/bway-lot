import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Submitter, Profile, EntryResult } from './types';
import { Show } from '../show-data';
import { AutomationEngine } from './engine';
import { logger } from '@/lib/logger';

chromium.use(StealthPlugin());

export class TelechargeSubmitter implements Submitter {
  /**
   * Single-show entry — thin wrapper around submitEntries for backward compatibility.
   */
  async submitEntry(show: Show, profile: Profile, sessionId: string): Promise<EntryResult> {
    const results = await this.submitEntries([show], profile, sessionId);
    return results[0];
  }

  /**
   * Multi-show entry — logs in ONCE, enters all requested shows, then closes browser.
   * This is the optimized path: one login per profile regardless of how many shows.
   */
  async submitEntries(shows: Show[], profile: Profile, sessionId: string): Promise<EntryResult[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
    });
    const page = await context.newPage();
    const profileName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'User';
    const showTitles = shows.map(s => s.title).join(', ');

    // [Bug 1 fix] Track results at the outer scope so partial successes survive a catch
    const results: EntryResult[] = [];

    try {
      logger.log(`[Telecharge] Starting session for ${profileName} — shows: ${showTitles}`, 'info');

      // =========== LOGIN (once) ===========
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      await page.goto('https://my.socialtoaster.com/st/campaign_login/?key=BROADWAY&source=iframe', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      await page.waitForTimeout(1500);
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

      await this.dismissOverlays(page);

      // Try to find login form — if not visible, click Sign In
      const emailField = page.locator('#login_email');
      const isEmailVisible = await emailField.isVisible({ timeout: 3000 }).catch(() => false);

      if (!isEmailVisible) {
        await this.dismissOverlays(page);
        await page.locator('#st_sign_in').click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);
        await this.dismissOverlays(page);
      }

      // Fill credentials
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      await page.fill('#login_email', profile.telechargeEmail || profile.email || '');
      await page.fill('#password', profile.telechargePassword || '');

      // Submit login
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      await page.locator('#login_form #get-started-button, #get-started-button, button[type="submit"]')
        .first()
        .click({ force: true });

      await page.waitForTimeout(5000);

      // [Concern 5 fix] Verify login actually succeeded before proceeding
      const loginFailed = await this.verifyLogin(page);
      if (loginFailed) {
        throw new Error(`Login failed for ${profileName}: ${loginFailed}`);
      }
      logger.log(`SUCCESS: Logged into Telecharge for ${profileName}`, 'success');

      // =========== ENTER SHOWS (iterate through all requested shows) ===========
      for (const show of shows) {
        if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

        try {
          logger.log(`[Telecharge] Navigating to lottery page for "${show.title}"...`, 'info');
          const result = await this.enterShowOnLotteryPage(page, show, profile, sessionId);
          results.push(result);
        } catch (error: any) {
          if (error.message === 'Stop signal received') throw error;
          logger.log(`[Telecharge] Failed to enter "${show.title}": ${error.message}`, 'error');
          results.push({
            showId: show.id,
            profileId: profile.id,
            success: false,
            message: `Submission failed: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      return results;

    } catch (error: any) {
      console.error(`[Telecharge] FATAL: ${error.message}`);
      // [Bug 1 fix] Only add failure entries for shows not already in results
      const processedIds = new Set(results.map(r => r.showId));
      for (const show of shows) {
        if (!processedIds.has(show.id)) {
          results.push({
            showId: show.id,
            profileId: profile.id,
            success: false,
            message: `Submission failed: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      return results;
    } finally {
      await browser.close();
    }
  }

  /**
   * [Concern 5 fix] Verify the login succeeded by checking page indicators.
   * Returns null if login succeeded, or an error description string if it failed.
   */
  private async verifyLogin(page: any): Promise<string | null> {
    const currentUrl = page.url();

    // If we're still on the login page, login likely failed
    if (currentUrl.includes('campaign_login')) {
      // Check for specific error messages
      const errorText = await page.locator('.error-message, .login-error, .st_error, #login_error, .alert-danger')
        .first()
        .innerText()
        .catch(() => '');
      if (errorText) {
        return `Login error: ${errorText.trim()}`;
      }
      return 'Still on login page after submission — credentials may be incorrect';
    }

    return null; // Login appears successful
  }

  /**
   * Navigate to the lottery page and enter a specific show.
   * Assumes the browser is already logged in.
   */
  private async enterShowOnLotteryPage(
    page: any,
    show: Show,
    profile: Profile,
    sessionId: string
  ): Promise<EntryResult> {
    // Navigate to lottery page
    if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
    await page.goto('https://my.socialtoaster.com/st/lottery_select/?key=BROADWAY&source=iframe', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(3000);
    if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

    await this.dismissOverlays(page);

    const showCount = await page.locator('.lottery_show').count().catch(() => 0);
    console.log(`[Telecharge] Found ${showCount} total shows on page. Searching for matching title: "${show.title}"`);

    // [Bug 2 fix] Scan buttons once and pass directly to enterLotteries
    const matchingResults = await this.getButtonsForShow(page, show.title);

    if (matchingResults.length === 0) {
      const debugUrl = page.url();
      const debugTitle = await page.title().catch(() => 'unknown');
      console.log(`[Telecharge] No matching ENTER buttons found for "${show.title}". URL: ${debugUrl}, Title: "${debugTitle}"`);
      return {
        showId: show.id,
        profileId: profile.id,
        success: false,
        message: `No active lotteries found for "${show.title}"`,
        timestamp: new Date().toISOString()
      };
    }

    console.log(`[Telecharge] Found ${matchingResults.length} matching card(s) for "${show.title}". Entering...`);
    // [Bug 2 fix] Pass pre-fetched results to avoid double scan
    return await this.enterLotteries(page, show.title, profile, show.id, sessionId, matchingResults);
  }

  private async dismissOverlays(page: any) {
    await page.evaluate(() => {
      ['st_campaign_popup_underlay', 'st_campaign_popup'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      const closeBtn = document.querySelector('.st_popup_close, .close-popup') as HTMLElement;
      if (closeBtn) closeBtn.click();
    }).catch(() => {});
  }

  private async getButtonsForShow(page: any, showTitle: string) {
    const showContainers = await page.locator('.lottery_show').all();
    const matchingResults: { buttons: any[], alreadyEntered: boolean }[] = [];
    
    for (const container of showContainers) {
      const titleEl = container.locator('.lottery_show_title, h2, h3, .title').first();
      const title = await titleEl.innerText().catch(() => '');
      const match = this.titlesMatch(title, showTitle);
      console.log(`[Telecharge] Card title found: "${title}". Match with "${showTitle}": ${match}`);
      
      if (match) {
        const cardText = await container.innerText().catch(() => '');
        const upperText = cardText.toUpperCase();
        
        if (upperText.includes('LOTTERY ENTERED!') || upperText.includes('ALREADY ENROLLED') || upperText.includes('ALREADY ENROLLED!')) {
          matchingResults.push({ buttons: [], alreadyEntered: true });
        } else {
          const buttons = await container.locator('a.st_campaign_button, button.st_campaign_button, a:has-text("ENTER"), button:has-text("ENTER")').all();
          matchingResults.push({ buttons, alreadyEntered: false });
        }
      }
    }
    return matchingResults;
  }

  private titlesMatch(pageTitle: string, targetTitle: string): boolean {
    if (!pageTitle || !targetTitle) return false;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const p = normalize(pageTitle);
    const t = normalize(targetTitle);
    if (!p || !t) return false;
    return p.includes(t) || t.includes(p);
  }

  /**
   * [Bug 2 fix] Now accepts pre-fetched matchingResults to avoid double scan.
   * [Bug 3 fix] After navigating back, re-fetches buttons instead of using stale locators.
   */
  private async enterLotteries(
    page: any,
    showTitle: string,
    profile: Profile,
    showId: string,
    sessionId: string,
    initialResults: { buttons: any[], alreadyEntered: boolean }[]
  ): Promise<EntryResult> {
    let successCount = 0;
    let alreadyEnteredCount = 0;
    
    // [Bug 3 fix] Use a while-loop with fresh button scans instead of iterating stale locators.
    // Process the initial results first, then re-scan after each navigation.
    let matchingResults = initialResults;
    let hasMoreButtons = true;

    while (hasMoreButtons) {
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

      hasMoreButtons = false;

      for (const res of matchingResults) {
        if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

        if (res.alreadyEntered) {
          alreadyEnteredCount++;
          console.log(`[Telecharge] Detected pre-existing entry for "${showTitle}".`);
          continue;
        }

        if (res.buttons.length === 0) continue;

        // [Bug 3 fix] Only click the FIRST button, then navigate back and re-scan
        const btn = res.buttons[0];
        const btnText = await btn.innerText().catch(() => '');
        logger.log(`[Telecharge] Clicking "${btnText}" for "${showTitle}"...`, 'info');
        console.log(`[Telecharge] Clicking button: "${btnText}" for "${showTitle}"`);
        await btn.click({ force: true });
        await page.waitForTimeout(3000);
        
        if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

        const content = await page.content();
        const lower = content.toLowerCase();
        if (lower.includes('success') || lower.includes('entered') || lower.includes('received') || lower.includes('enrolled')) {
          if (lower.includes('already')) {
            alreadyEnteredCount++;
            logger.log(`[Telecharge] Confirmed pre-existing entry for "${showTitle}"`, 'info');
          } else {
            successCount++;
            logger.log(`SUCCESS: Entered performance for "${showTitle}"`, 'success');
          }
        }

        // Navigate back to the lottery selection page
        await page.goto('https://my.socialtoaster.com/st/lottery_select/?key=BROADWAY&source=iframe', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        }).catch(() => {});
        await page.waitForTimeout(2000);
        await this.dismissOverlays(page);

        // [Bug 3 fix] Re-scan for fresh buttons after navigation
        matchingResults = await this.getButtonsForShow(page, showTitle);
        const remainingClickable = matchingResults.some(r => !r.alreadyEntered && r.buttons.length > 0);
        if (remainingClickable) {
          hasMoreButtons = true;
        }
        break; // Break inner for-loop to restart with fresh results
      }
    }

    return {
      showId,
      profileId: profile.id,
      success: successCount > 0 || alreadyEnteredCount > 0,
      isAlreadyEntered: successCount === 0 && alreadyEnteredCount > 0,
      message: successCount > 0
        ? `Entered performance(s) for "${showTitle}"${alreadyEnteredCount > 0 ? ` (${alreadyEnteredCount} already entered)` : ''}`
        : alreadyEnteredCount > 0
        ? `Already entered all active performances for "${showTitle}"`
        : `No entries successful for "${showTitle}"`,
      timestamp: new Date().toISOString()
    };
  }
}

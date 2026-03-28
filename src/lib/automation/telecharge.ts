import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Submitter, Profile, EntryResult } from './types';
import { Show } from '../show-data';
import { AutomationEngine } from './engine';
import { logger } from '@/lib/logger';

chromium.use(StealthPlugin());

export class TelechargeSubmitter implements Submitter {
  async submitEntry(show: Show, profile: Profile, sessionId: string): Promise<EntryResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
    });
    const page = await context.newPage();

    try {
      console.log(`[Telecharge] Starting entry for ${show.title} - ${profile.firstName || ''} ${profile.lastName || ''}`);
      
      // Step 1: Go directly to login page
      console.log('[Telecharge] Step 1: Navigating to login page...');
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      await page.goto('https://my.socialtoaster.com/st/campaign_login/?key=BROADWAY&source=iframe', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      console.log('[Telecharge] Step 1: Page loaded.');
      await page.waitForTimeout(1500);
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

      // Nuke all overlays via JS
      await this.dismissOverlays(page);

      // Try to find login form - if not visible, click Sign In
      console.log('[Telecharge] Step 2: Looking for login form...');
      const emailField = page.locator('#login_email');
      const isEmailVisible = await emailField.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!isEmailVisible) {
        console.log('[Telecharge] Login form hidden. Clicking Sign In...');
        await this.dismissOverlays(page);
        await page.locator('#st_sign_in').click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500);
        await this.dismissOverlays(page);
      }

      // Fill credentials
      console.log('[Telecharge] Step 3: Filling credentials...');
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      await page.fill('#login_email', profile.telechargeEmail || profile.email || '');
      await page.fill('#password', profile.telechargePassword || '');

      // Submit login
      console.log('[Telecharge] Step 4: Submitting login...');
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      await page.locator('#login_form #get-started-button, #get-started-button, button[type="submit"]')
        .first()
        .click({ force: true });

      // Wait briefly for redirect — don't block forever
      console.log('[Telecharge] Step 5: Waiting for redirect...');
      await page.waitForTimeout(5000);
      logger.log(`SUCCESS: Logged into Telecharge for ${profile.firstName || profile.email}`, 'success');

      // Step 2: Navigate to lottery page — use domcontentloaded, NOT networkidle
      console.log('[Telecharge] Step 6: Navigating to lottery page...');
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
      await page.goto('https://my.socialtoaster.com/st/lottery_select/?key=BROADWAY&source=iframe', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      console.log('[Telecharge] Step 6: Lottery page loaded.');
      await page.waitForTimeout(3000);
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

      // Dismiss overlays on lottery page too
      await this.dismissOverlays(page);

      const showCount = await page.locator('.lottery_show').count().catch(() => 0);
      console.log(`[Telecharge] Found ${showCount} total shows on page. Searching for matching title: "${show.title}"`);
      
      const matchingButtons = await this.getButtonsForShow(page, show.title);

      if (matchingButtons.length === 0) {
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

      console.log(`[Telecharge] Found ${matchingButtons.length} ENTER buttons for "${show.title}". Entering...`);
      return await this.enterLotteries(page, show.title, profile, show.id, sessionId);

    } catch (error: any) {
      console.error(`[Telecharge] FATAL: ${error.message}`);
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

  private async enterLotteries(
    page: any,
    showTitle: string,
    profile: Profile,
    showId: string,
    sessionId: string
  ): Promise<EntryResult> {
    let successCount = 0;
    let alreadyEnteredCount = 0;
    
    // Get initial list to know what's on the page
    const matchingResults = await this.getButtonsForShow(page, showTitle);
    
    for (const res of matchingResults) {
      if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');

      if (res.alreadyEntered) {
        alreadyEnteredCount++;
        console.log(`[Telecharge] Detected pre-existing entry for "${showTitle}".`);
        continue;
      }

      for (const btn of res.buttons) {
        if (AutomationEngine.currentSessionId !== sessionId) throw new Error('Stop signal received');
        
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

        // Navigate back to the lottery selection page to process next button/perf
        await page.goto('https://my.socialtoaster.com/st/lottery_select/?key=BROADWAY&source=iframe', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        }).catch(() => {});
        await page.waitForTimeout(2000);
        await this.dismissOverlays(page);
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

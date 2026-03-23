import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Submitter, Profile, EntryResult } from './types';
import { Show } from '../show-data';
import { TurnstileSolver } from './turnstile-solver';
import { logger } from '../logger';
import fs from 'fs';
import path from 'path';

const GET_SESSION_PATH = (email?: string) => {
  const safeEmail = (email || 'guest').replace(/[^a-zA-Z0-9]/g, '-');
  return path.join(process.cwd(), 'data', 'sessions', `bd-${safeEmail}.json`);
};

chromium.use(StealthPlugin());

export class BroadwayDirectSubmitter implements Submitter {
  async submitEntry(show: Show, profile: Profile): Promise<EntryResult> {
    const browser = await chromium.launch({ headless: true });
    const sessionPath = GET_SESSION_PATH(profile.email);
    const sessionDir = path.dirname(sessionPath);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const storageState = fs.existsSync(sessionPath) ? sessionPath : undefined;
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    try {
      logger.log(`[BroadwayDirect] Starting entry for ${show.title} - ${profile.firstName || ''} ${profile.lastName || ''}`, 'info');
      await page.goto(show.link, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Initial Turnstile check
      await this.solveTurnstileIfNeeded(page);

      // --- Discover all open lotteries ---
      logger.log('[BroadwayDirect] Scanning for open lotteries...', 'info');
      const enterNowLocators = await page.locator('button:has-text("ENTER NOW"), a:has-text("ENTER NOW"), [role="button"]:has-text("ENTER NOW")').all();
      
      const entryLinks: string[] = [];
      for (const loc of enterNowLocators) {
        if (await loc.isVisible().catch(() => false)) {
          const href = await loc.getAttribute('href').catch(() => null);
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `https://lottery.broadwaydirect.com${href}`;
            if (!entryLinks.includes(fullUrl)) entryLinks.push(fullUrl);
          }
        }
      }

      if (entryLinks.length === 0) {
        if (enterNowLocators.length > 0) {
           logger.log('[BroadwayDirect] No hrefs found, attempting direct click on first button.', 'info');
           await enterNowLocators[0].click({ force: true }).catch(() => {});
           await page.waitForTimeout(2000);
           await this.fillAndSubmitForm(page, profile);
           return { showId: show.id, profileId: profile.id, success: true, message: 'Entered (single click fallback)', timestamp: new Date().toISOString() };
        }
        
        const isClosed = await page.locator(':has-text("Lottery is currently closed")').first().isVisible().catch(() => false);
        if (isClosed) {
          return { showId: show.id, profileId: profile.id, success: false, message: 'Lottery is currently closed', timestamp: new Date().toISOString() };
        }
        throw new Error('No open lotteries found on page');
      }

      logger.log(`[BroadwayDirect] Found ${entryLinks.length} open lotteries. Processing sequentially...`, 'info');
      let successCount = 0;
      let totalFailed = 0;

      for (const link of entryLinks) {
        try {
          logger.log(`[BroadwayDirect] Entering lottery: ${link}`, 'info');
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await this.fillAndSubmitForm(page, profile);
          successCount++;
          // Save session after first success to keep cookies warm
          await context.storageState({ path: sessionPath });
        } catch (e: any) {
          logger.log(`[BroadwayDirect] Failed entry for ${link}: ${e.message}`, 'error');
          totalFailed++;
        }
      }

      return {
        showId: show.id,
        profileId: profile.id,
        success: successCount > 0,
        message: successCount > 0 
          ? `Successfully entered ${successCount} lottery(ies)${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`
          : `Failed all ${entryLinks.length} entries`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      const screenshotPath = `logs/error-${show.id}-${Date.now()}.png`;
      try { await page.screenshot({ path: screenshotPath }); } catch {}
      console.error(`[BroadwayDirect] Failed to submit entry for ${show.title}:`, error.message);
      return {
        showId: show.id,
        profileId: profile.id,
        success: false,
        message: `Submission failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        screenshotPath
      };
    } finally {
      await browser.close();
    }
  }

  private async solveTurnstileIfNeeded(page: any) {
    const hasTurnstile = await page.locator('iframe[src*="challenges.cloudflare.com"], div.cf-turnstile, #turnstile-wrapper').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTurnstile) {
      logger.log(`[BroadwayDirect] Cloudflare Turnstile detected! Solving...`, 'warning');
      let siteKey = await page.evaluate(() => {
        const wrapper = document.querySelector('.cf-turnstile, div[data-sitekey]');
        if (wrapper) return wrapper.getAttribute('data-sitekey');
        for (const iframe of Array.from(document.querySelectorAll('iframe'))) {
          const src = iframe.getAttribute('src');
          if (src && src.includes('sitekey=')) return new URL(src).searchParams.get('sitekey');
        }
        return null;
      }).catch(() => null);

      if (!siteKey) siteKey = '0x4AAAAAAABkMYinukE8nzYS';

      const solver = new TurnstileSolver();
      const token = await solver.solve(page.url(), siteKey);
      if (token) {
        await page.evaluate((responseToken: string) => {
          let input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement;
          if (!input) {
            const form = document.querySelector('form');
            if (form) {
              input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'cf-turnstile-response';
              form.appendChild(input);
            }
          }
          if (input) input.value = responseToken;
          if ((window as any).turnstileCallback) (window as any).turnstileCallback(responseToken);
        }, token);
        logger.log('[BroadwayDirect] ✅ Turnstile token injected.', 'success');
        await page.waitForTimeout(2000);
      }
    }
  }

  private async fillAndSubmitForm(page: any, profile: Profile) {
    // Nuke OneTrust
    await page.evaluate(() => {
      const ot = document.getElementById('onetrust-consent-sdk');
      if (ot) ot.style.display = 'none';
      const filter = document.querySelector('.onetrust-pc-dark-filter');
      if (filter) (filter as HTMLElement).style.display = 'none';
    }).catch(() => {});

    // Solve Turnstile on form page if needed
    await this.solveTurnstileIfNeeded(page);

    const firstNameLocator = page.getByRole('textbox', { name: /first name/i }).or(page.locator('input[name*="first" i]')).first();
    await firstNameLocator.waitFor({ state: 'visible', timeout: 30000 });

    await firstNameLocator.fill(profile.firstName || '');
    await page.getByRole('textbox', { name: /last name/i }).or(page.locator('input[name*="last" i]')).first().fill(profile.lastName || '');
    await page.getByRole('textbox', { name: /email/i }).or(page.locator('input[type="email"], input[name*="email" i]')).first().fill(profile.email || '');
    await page.getByRole('textbox', { name: /zip/i }).or(page.locator('input[name*="zip" i]')).first().fill(profile.zipCode || '');
    
    // Qty
    const qtyInput = page.getByLabel(/QTY OF TICKETS/i).or(page.locator('input[name*="qty" i], select[name*="qty" i]')).first();
    if (await qtyInput.isVisible().catch(() => false)) {
      const tagName = await qtyInput.evaluate((e: any) => e.tagName.toLowerCase());
      if (tagName === 'select') await qtyInput.selectOption('2');
      else await qtyInput.fill('2');
    }

    // DOB
    if (profile.dob) {
      const mm = page.getByPlaceholder(/MM/i).or(page.locator('[name*="month" i]')).first();
      if (await mm.isVisible()) await mm.fill(profile.dob.month);
      const dd = page.getByPlaceholder(/DD/i).or(page.locator('[name*="day" i]')).first();
      if (await dd.isVisible()) await dd.fill(profile.dob.day);
      const yy = page.getByPlaceholder(/YYYY/i).or(page.locator('[name*="year" i]')).first();
      if (await yy.isVisible()) await yy.fill(profile.dob.year);
    }

    // Terms
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      await page.evaluate((el: any) => {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, checkbox);
    }

    const submitBtn = page.getByRole('button', { name: /ENTER|Submit/i }).or(page.locator('button[type="submit"]')).first();
    await submitBtn.click({ force: true });

    await page.waitForSelector('.success-message, :has-text("Your lottery entry has been received"), :has-text("SUCCESS")', { timeout: 20000 });
  }
}

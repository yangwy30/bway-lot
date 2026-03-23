import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Submitter, Profile, EntryResult } from './types';
import { Show } from '../show-data';
import { BotSolver } from './turnstile-solver';
import { AutomationEngine } from './engine';
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
      await this.solveBotChallengeIfNeeded(page);

      // --- Discover all open lotteries ---
      logger.log('[BroadwayDirect] Scanning for open lotteries...', 'info');
      await page.waitForTimeout(2000); // Wait for animations/rendering
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
           await this.fillAndSubmitForm(page, profile, show.id);
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
        if ((AutomationEngine as any).isStopped) {
          logger.log('[BroadwayDirect] Aborting remaining entries due to stop signal', 'warning');
          break;
        }
        try {
          logger.log(`[BroadwayDirect] Entering lottery: ${link}`, 'info');
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await this.fillAndSubmitForm(page, profile, show.id);
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

  private async solveBotChallengeIfNeeded(page: any) {
    const hCaptcha = await page.locator('.h-captcha').first().isVisible({ timeout: 1000 }).catch(() => false);
    const turnstile = await page.locator('iframe[src*="challenges.cloudflare.com"], div.cf-turnstile, #turnstile-wrapper').first().isVisible({ timeout: 1000 }).catch(() => false);
    const reCaptcha = await page.locator('iframe[src*="recaptcha/api2"], .g-recaptcha, #g-recaptcha').first().isVisible({ timeout: 1000 }).catch(() => false);

    if (turnstile) {
      logger.log(`[BroadwayDirect] Cloudflare Turnstile detected! Solving...`, 'warning');
      await this.solveWithBotSolver(page, 'turnstile');
    } else if (reCaptcha) {
      logger.log(`[BroadwayDirect] Google reCAPTCHA detected! Solving...`, 'warning');
      await this.solveWithBotSolver(page, 'recaptcha');
    }
  }

  private async solveWithBotSolver(page: any, type: 'turnstile' | 'recaptcha') {
    let siteKey = await page.evaluate((t: string) => {
      if (t === 'turnstile') {
        const wrapper = document.querySelector('.cf-turnstile, div[data-sitekey]');
        if (wrapper) return wrapper.getAttribute('data-sitekey');
      } else {
        const wrapper = document.querySelector('.g-recaptcha, div[data-sitekey]');
        if (wrapper) return wrapper.getAttribute('data-sitekey');
      }
      for (const iframe of Array.from(document.querySelectorAll('iframe'))) {
        const src = iframe.getAttribute('src');
        if (src && src.includes('sitekey=')) return new URL(src).searchParams.get('sitekey');
      }
      return null;
    }, type).catch(() => null);

    if (!siteKey) siteKey = type === 'turnstile' ? '0x4AAAAAAABkMYinukE8nzYS' : '6Ld_W90aAAAAAA_S_fX_X1_X1_X1_X1'; // Fallback keys

    const solver = new BotSolver();
    const token = await solver.solve(page.url(), siteKey, type);
    if (token) {
      await page.evaluate(({ responseToken, type }: { responseToken: string, type: string }) => {
        const name = type === 'turnstile' ? 'cf-turnstile-response' : 'g-recaptcha-response';
        let input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        if (!input) {
          const form = document.querySelector('form');
          if (form) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            form.appendChild(input);
          }
        }
        if (input) input.value = responseToken;

        // Find callback dynamically
        const botEl = document.querySelector('.cf-turnstile, .g-recaptcha, [data-sitekey]');
        const dynamicCallback = botEl?.getAttribute('data-callback');
        
        const possibleCallbacks = [
          dynamicCallback,
          type === 'turnstile' ? 'turnstileCallback' : 'reCaptchaCallback',
          'afterCaptcha',
          'onSubmit',
          'onCaptchaSubmit',
          'onCaptchaSuccess'
        ].filter(Boolean) as string[];

        // Also search window for anything containing captcha/turnstile
        Object.keys(window).forEach(key => {
          if (key.toLowerCase().includes('captcha') || key.toLowerCase().includes('turnstile')) {
            if (typeof (window as any)[key] === 'function') possibleCallbacks.push(key);
          }
        });

        possibleCallbacks.forEach(cb => {
          try {
            if (typeof (window as any)[cb] === 'function') {
              (window as any)[cb](responseToken);
            }
          } catch (e) {}
        });
      }, { responseToken: token, type });
      logger.log(`[BroadwayDirect] ✅ ${type} token injected.`, 'success');
      await page.waitForTimeout(2000);
    }
  }

  private async fillAndSubmitForm(page: any, profile: Profile, showId: string) {
    // 1. Aggressively nuke OneTrust and other banners FIRST to avoid blocking
    await page.evaluate(() => {
      const nuke = () => {
        const selectors = [
          '#onetrust-consent-sdk', 
          '.onetrust-pc-dark-filter', 
          '#onetrust-banner-sdk', 
          '.optanon-alert-box-wrapper',
          '.ot-sdk-container',
          '.ot-sdk-row'
        ];
        selectors.forEach(s => {
          const els = document.querySelectorAll(s);
          els.forEach(el => el.remove());
        });
        // Unlock scrolling
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      };
      nuke();
      const interval = setInterval(nuke, 500);
      setTimeout(() => clearInterval(interval), 3000);
    }).catch(() => {});

    // 2. Handle cookie banner via interaction as a courtesy, but with very short timeouts
    try {
      const declineBtn = page.locator('#onetrust-reject-all-handler, button:has-text("I Decline"), button:has-text("Decline All")').first();
      const acceptBtn = page.locator('#onetrust-accept-btn-handler, button:has-text("I Accept"), button:has-text("Accept All")').first();
      
      if (await declineBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        logger.log('[BroadwayDirect] Clicking "I Decline" on cookie banner...', 'info');
        await declineBtn.click({ timeout: 2000 }).catch(() => {});
      } else if (await acceptBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        logger.log('[BroadwayDirect] Clicking "I Accept" on cookie banner...', 'info');
        await acceptBtn.click({ timeout: 2000 }).catch(() => {});
      }
    } catch (e) {} 


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

    // Country (New mandatory field for some shows)
    const countrySelect = page.locator('select[name*="country" i], select[id*="country" i], div:has-text("COUNTRY OF RESIDENCE") + div, .country-select').first();
    if (await countrySelect.isVisible().catch(() => false)) {
      logger.log('[BroadwayDirect] Selecting Country: United States', 'info');
      try {
        await countrySelect.click({ force: true, timeout: 5000 }).catch(() => {});
        await page.locator('text=United States').first().click({ force: true, timeout: 5000 }).catch(() => {});
        // Fallback to selectOption with a more flexible matching via evaluate
        const tagName = await countrySelect.evaluate((e: any) => e.tagName.toLowerCase());
        if (tagName === 'select') {
           await countrySelect.evaluate((sel: HTMLSelectElement) => {
             const options = Array.from(sel.options);
             const usOption = options.find(o => /united states|usa|\bus\b/i.test(o.text) || /united states|usa|\bus\b/i.test(o.value));
             if (usOption) {
               sel.value = usOption.value;
               sel.dispatchEvent(new Event('change', { bubbles: true }));
             } else if (options.length > 1) {
               sel.selectedIndex = 1; // Fallback to first non-placeholder
               sel.dispatchEvent(new Event('change', { bubbles: true }));
             }
           }).catch(() => {});
        }
      } catch (e) {}
    }

    // Terms
    // Harden terms checkbox selection
    const termsCheckbox = page.locator('input[type="checkbox"][name*="terms" i], #dlslot_terms').first();
    await termsCheckbox.scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => {
      const cb = document.querySelector('input[type="checkbox"][name*="terms" i], #dlslot_terms') as HTMLInputElement;
      if (cb) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }).catch(() => {});
    await termsCheckbox.check({ force: true }).catch(async () => {
       await page.locator('label[for*="terms" i], label:has-text("Terms"), .terms-label').first().click({ force: true }).catch(() => {});
    });

    const submitBtn = page.getByRole('button', { name: /ENTER|Submit/i }).or(page.locator('button[type="submit"]')).first();
    // Ensure page is scrolled to bottom before clicking Enter.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await submitBtn.scrollIntoViewIfNeeded().catch(() => {});
    
    // Final Bot check (Turnstile/reCAPTCHA) on the form right before clicking submit!
    await this.solveBotChallengeIfNeeded(page);
    
    await page.waitForTimeout(500);
    await submitBtn.click({ force: true });

    const successSelector = '.success-message, :has-text("Your lottery entry has been received"), :has-text("SUCCESS"), :has-text("already entered"), :has-text("Already have an entry"), :has-text("ALMOST DONE"), :has-text("validation link"), :has-text("check your email")';
    logger.log('[BroadwayDirect] Form submitted. Waiting for confirmation...', 'info');
    
    try {
      const responseMsg = await page.waitForSelector(successSelector, { timeout: 20000 });
      const text = await responseMsg.innerText();
      if (text.toLowerCase().includes('already')) {
         logger.log(`[BroadwayDirect] Already entered for this performance.`, 'info');
      } else {
         logger.log(`[BroadwayDirect] ✅ Entry confirmed: ${text.substring(0, 50)}...`, 'success');
      }
    } catch (e) {
      const screenshotPath = `logs/form-fail-${showId}-${profile.id}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath }).catch(() => {});
      const content = await page.content().catch(() => 'could not get content');
      console.log(`[BroadwayDirect] Form fail content snippet: ${content.substring(0, 500)}`);
      throw new Error(`Success message not found after submission. Screenshot saved to ${screenshotPath}`);
    }
  }
}

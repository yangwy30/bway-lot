import { Show } from '../show-data';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

chromium.use(StealthPlugin());

const PROFILES_PATH = path.join(process.cwd(), 'data', 'profiles.json');

/**
 * Read the first profile that has Telecharge credentials from the profiles store.
 */
function getTelechargeCredentials(): { email: string; password: string } | null {
  if (!fs.existsSync(PROFILES_PATH)) return null;
  try {
    const all = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8'));
    const profile = all.find(
      (p: any) => p.telechargeEmail && p.telechargePassword
    );
    if (profile) {
      return { email: profile.telechargeEmail, password: profile.telechargePassword };
    }
  } catch {}
  return null;
}

export async function scrapeBroadwayDirect(): Promise<Show[]> {
  // TODO: implement playwright extraction
  return [];
}

export async function scrapeRushTelecharge(): Promise<Show[]> {
  const creds = getTelechargeCredentials();
  if (!creds) {
    console.log('[Scraper:Telecharge] No Telecharge credentials found in profiles. Skipping scrape.');
    return [];
  }

  let browser;
  try {
    console.log('[Scraper:Telecharge] Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
    });
    const page = await context.newPage();

    // Step 1: Login
    console.log('[Scraper:Telecharge] Navigating to login page...');
    await page.goto(
      'https://my.socialtoaster.com/st/campaign_login/?key=BROADWAY&source=iframe',
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(2000);

    // Dismiss popup overlays that block interaction
    await page.evaluate(() => {
      const overlay = document.getElementById('st_campaign_popup_underlay');
      if (overlay) overlay.remove();
      const popup = document.getElementById('st_campaign_popup');
      if (popup) popup.remove();
    }).catch(() => {});

    // Wait for login form or click Sign In first
    try {
      await page.waitForSelector('#login_email', { state: 'visible', timeout: 10000 });
    } catch {
      await page.evaluate(() => {
        const overlay = document.getElementById('st_campaign_popup_underlay');
        if (overlay) overlay.remove();
      }).catch(() => {});
      await page.locator('#st_sign_in').click({ force: true }).catch(() => {});
      await page.waitForSelector('#login_email', { state: 'visible', timeout: 10000 });
    }

    await page.fill('#login_email', creds.email);
    await page.fill('#password', creds.password);

    const loginBtn = page
      .locator('#login_form #get-started-button, #get-started-button, button[type="submit"]')
      .first();
    await loginBtn.click({ force: true });

    try {
      await page.waitForURL(/campaign_stats|lottery_select|dashboard/, {
        timeout: 30000,
      });
    } catch {
      console.log('[Scraper:Telecharge] Login redirect timed out, proceeding anyway...');
    }

    // Step 2: Navigate to lottery select page
    console.log('[Scraper:Telecharge] Navigating to lottery selection page...');
    await page.goto(
      'https://my.socialtoaster.com/st/lottery_select/?key=BROADWAY&source=iframe',
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(3000);

    // Step 3: Extract HTML and parse with Cheerio
    const html = await page.content();
    const shows = parseTelechargeHTML(html);

    console.log(`[Scraper:Telecharge] Found ${shows.length} shows.`);
    return shows;
  } catch (error: any) {
    console.error('[Scraper:Telecharge] Scrape failed:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Parse the SocialToaster lottery_select HTML into Show objects.
 * Uses ".lottery_show" elements with ".lottery_show_title", ".lottery_show_date",
 * and `enter_event(eventId)` onclick patterns — matching test-extract.ts logic.
 */
function parseTelechargeHTML(html: string): Show[] {
  const $ = cheerio.load(html);
  const showMap = new Map<string, Show>();

  $('.lottery_show').each((_i: any, el: any) => {
    const title = $(el).find('.lottery_show_title').text().trim();
    const date = $(el).find('.lottery_show_date').text().trim();

    // Extract eventId from onclick handler: enter_event(12345)
    const enterBtn = $(el).find('a.st_campaign_button');
    const onclick = enterBtn.attr('onclick') || '';
    const eventIdMatch = onclick.match(/enter_event\((\d+)\)/);
    const eventId = eventIdMatch ? eventIdMatch[1] : null;

    // Try to extract image
    const imgEl = $(el).find('img');
    const image = imgEl.attr('src') || undefined;

    if (!title) return; // skip empty entries

    if (showMap.has(title)) {
      // Add another performance to the existing show
      const existing = showMap.get(title)!;
      if (date && eventId) {
        existing.performances = existing.performances || [];
        // Avoid duplicate performances
        if (!existing.performances.some((p) => p.eventId === eventId)) {
          existing.performances.push({ date, eventId });
        }
      }
    } else {
      // Create a new show entry
      const id = `tc-live-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      const show: Show = {
        id,
        site: 'Telecharge',
        title,
        link: 'https://rush.telecharge.com/',
        image,
        performances: date && eventId ? [{ date, eventId }] : [],
      };
      showMap.set(title, show);
    }
  });

  return Array.from(showMap.values());
}

export async function scrapeLuckySeat(): Promise<Show[]> {
  // TODO: implement playwright extraction
  return [];
}

export async function scrapeAllSites(): Promise<Show[]> {
  try {
    const results = await Promise.all([
      scrapeBroadwayDirect(),
      scrapeRushTelecharge(),
      scrapeLuckySeat(),
    ]);
    return results.flat();
  } catch (error) {
    console.error('Failed to scrape all sites:', error);
    return [];
  }
}

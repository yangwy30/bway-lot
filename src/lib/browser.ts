import { chromium } from 'playwright-extra';
// @ts-expect-error - no types for stealth plugin
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply the stealth plugin to avoid Cloudflare bot detection
chromium.use(stealthPlugin());

export async function getBrowserContext() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
  });

  return { browser, context };
}

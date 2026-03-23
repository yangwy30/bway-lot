/**
 * Plain JS test script for BroadwayDirect SIX (NY) entry.
 * Runs with: node src/test-six-entry.mjs
 */
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

chromium.use(StealthPlugin());

const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;
const CAPSOLVER_API_URL = 'https://api.capsolver.com';

// --- TurnstileSolver ---
async function solveTurnstile(siteKey, pageUrl) {
  console.log(`[TurnstileSolver] Creating task for siteKey=${siteKey.substring(0, 12)}...`);

  const createRes = await fetch(`${CAPSOLVER_API_URL}/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientKey: CAPSOLVER_API_KEY,
      task: {
        type: 'AntiTurnstileTaskProxyLess',
        websiteURL: pageUrl,
        websiteKey: siteKey,
      }
    })
  });

  const createData = await createRes.json();
  if (createData.errorId !== 0) {
    throw new Error(`Create task failed: ${createData.errorDescription || JSON.stringify(createData)}`);
  }

  const taskId = createData.taskId;
  console.log(`[TurnstileSolver] Task created: ${taskId}. Polling...`);

  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 3000));

    const resultRes = await fetch(`${CAPSOLVER_API_URL}/getTaskResult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientKey: CAPSOLVER_API_KEY, taskId })
    });

    const resultData = await resultRes.json();
    if (resultData.status === 'ready') {
      console.log(`[TurnstileSolver] ✅ Solved in ${attempt + 1} polls.`);
      return resultData.solution?.token;
    }
    if (resultData.status === 'failed') {
      throw new Error(`Task failed: ${resultData.errorDescription}`);
    }
    console.log(`[TurnstileSolver] Poll ${attempt + 1}/30: ${resultData.status}`);
  }
  throw new Error('Timeout: 30 polls exceeded.');
}

// --- Profile ---
const profilesPath = path.join(process.cwd(), 'data', 'profiles.json');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
const profile = profiles[0];

const SHOW_URL = 'https://lottery.broadwaydirect.com/show/six-ny/';

async function main() {
  console.log('🎭 BroadwayDirect SIX (NY) — CapSolver Auto-Bypass\n');
  console.log(`👤 Profile: ${profile.firstName} ${profile.lastName} (${profile.email})`);
  console.log(`🔗 URL: ${SHOW_URL}\n`);

  if (!CAPSOLVER_API_KEY) {
    console.error('❌ CAPSOLVER_API_KEY not set.');
    process.exit(1);
  }
  console.log(`🔑 CapSolver API Key: ${CAPSOLVER_API_KEY.substring(0, 8)}...`);

  const SESSION_PATH = path.join(process.cwd(), 'data', 'sessions', 'bd-session.json');
  const sessionDir = path.dirname(SESSION_PATH);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const storageState = fs.existsSync(SESSION_PATH) ? SESSION_PATH : undefined;
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    // Step 1: Navigate
    console.log('\n[Step 1] Navigating to BroadwayDirect...');
    await page.goto(SHOW_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Step 2: Check for Turnstile
    console.log('[Step 2] Checking for Cloudflare Turnstile...');
    const pageContent = await page.content();
    const hasTurnstile = pageContent.includes('challenges.cloudflare.com') || 
                         pageContent.includes('cf-turnstile') ||
                         pageContent.includes('turnstile');

    if (hasTurnstile) {
      console.log('[Step 2] ⚡ Turnstile detected! Solving with CapSolver...');

      // Extract siteKey
      let siteKey = await page.evaluate(() => {
        const el = document.querySelector('div.cf-turnstile, div[data-sitekey], [data-sitekey]');
        return el ? el.getAttribute('data-sitekey') : null;
      });

      if (!siteKey) {
        // Try extracting from script or iframe
        siteKey = await page.evaluate(() => {
          const scripts = document.querySelectorAll('script');
          for (const s of scripts) {
            const match = s.textContent?.match(/sitekey['":\s]*['"]([0-9a-zA-Z_-]+)['"]/i);
            if (match) return match[1];
          }
          const iframe = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
          if (iframe) {
            try {
              const url = new URL(iframe.src);
              return url.searchParams.get('k');
            } catch {}
          }
          return null;
        });
      }

      if (!siteKey) {
        siteKey = '0x4AAAAAAABkMYinukE8nzYS'; // Known BD fallback
        console.log(`[Step 2] Using fallback siteKey: ${siteKey}`);
      } else {
        console.log(`[Step 2] Extracted siteKey: ${siteKey}`);
      }

      const token = await solveTurnstile(siteKey, SHOW_URL);
      console.log(`[Step 2] Token received (${token.length} chars). Injecting...`);

      // Inject token
      await page.evaluate((t) => {
        const input = document.querySelector('input[name="cf-turnstile-response"]');
        if (input) input.value = t;
        // Try setting on window callback
        if (window.turnstileCallback) window.turnstileCallback(t);
      }, token);

      await page.waitForTimeout(3000);

      // Re-navigate after solving
      console.log('[Step 2] Re-navigating...');
      await page.goto(SHOW_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
    } else {
      console.log('[Step 2] No Turnstile detected. Proceeding...');
    }

    // Save session
    await context.storageState({ path: SESSION_PATH });
    console.log('[Step 2] Session cookies saved.');

    // Step 3: Check lottery status
    console.log('\n[Step 3] Checking lottery status...');
    const bodyText = await page.innerText('body').catch(() => '');
    console.log(`[Step 3] Page text snippet: "${bodyText.substring(0, 200)}..."`);

    const isClosed = bodyText.toLowerCase().includes('lottery is currently closed') || 
                     bodyText.toLowerCase().includes('currently closed');
    
    if (isClosed) {
      console.log('\n❌ Lottery is currently CLOSED for SIX (NY).');
      const ss = `logs/six-closed-${Date.now()}.png`;
      await page.screenshot({ path: ss });
      console.log(`Screenshot saved: ${ss}`);
    } else {
      console.log('[Step 3] Lottery may be open! Looking for Enter button...');
      
      // Try to find and click Enter Now
      const enterBtn = page.getByRole('button', { name: /enter now/i });
      if (await enterBtn.isVisible().catch(() => false)) {
        await enterBtn.click();
        console.log('[Step 3] Clicked Enter Now!');
      }

      // Fill the form
      console.log('\n[Step 4] Filling form...');
      await page.fill('input[name="firstname"]', profile.firstName).catch(() => {});
      await page.fill('input[name="lastname"]', profile.lastName).catch(() => {});
      await page.fill('input[name="email"]', profile.email).catch(() => {});
      await page.fill('input[name="phone"]', profile.phone).catch(() => {});
      await page.fill('input[name="zipcode"]', profile.zipCode).catch(() => {});

      if (profile.dob) {
        await page.selectOption('select[name="dob_month"]', profile.dob.month).catch(() => {});
        await page.selectOption('select[name="dob_day"]', profile.dob.day).catch(() => {});
        await page.selectOption('select[name="dob_year"]', profile.dob.year).catch(() => {});
      }

      // Checkboxes
      const checkboxes = await page.$$('input[type="checkbox"]');
      for (const cb of checkboxes) {
        await cb.check().catch(() => {});
      }

      // Submit
      await page.click('button#submit-entry').catch(async () => {
        const submitBtn = page.locator('button[type="submit"]').first();
        if (await submitBtn.isVisible().catch(() => false)) await submitBtn.click();
      });

      await page.waitForTimeout(5000);
      const ss = `logs/six-result-${Date.now()}.png`;
      await page.screenshot({ path: ss });
      console.log(`\n✅ Entry attempted! Screenshot: ${ss}`);
    }

  } catch (err) {
    const ss = `logs/six-error-${Date.now()}.png`;
    await page.screenshot({ path: ss }).catch(() => {});
    console.error(`\n❌ Error: ${err.message}`);
    console.log(`Screenshot: ${ss}`);
  } finally {
    await browser.close();
  }
}

main();

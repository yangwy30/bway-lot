import { getBrowserContext } from './lib/browser';
import fs from 'fs';

async function run() {
  try {
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();

    console.log("Navigating to Telecharge iframe...");
    await page.goto('https://my.socialtoaster.com/st/campaign_landing/?key=BROADWAY&source=iframe', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const html = await page.content();
    fs.writeFileSync('telecharge-iframe.html', html);
    await page.screenshot({ path: 'telecharge-iframe.png', fullPage: true });

    await browser.close();
    console.log("Done.");
  } catch (error) {
    console.error("Test failed:", error);
  }
}
run();

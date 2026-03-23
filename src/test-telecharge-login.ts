import { getBrowserContext } from './lib/browser';
import fs from 'fs';

async function run() {
  try {
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();
    
    console.log("Navigating to Telecharge true login page...");
    await page.goto('https://my.socialtoaster.com/st/campaign_login/?key=BROADWAY&source=iframe', { waitUntil: 'networkidle' });
    
    await page.screenshot({ path: 'telecharge-login-page.png', fullPage: true });
    
    const html = await page.content();
    fs.writeFileSync('telecharge-login-page.html', html);
    
    await browser.close();
    console.log("Done.");
  } catch (error) {
    console.error("Failed:", error);
  }
}
run();

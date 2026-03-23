import { getBrowserContext } from './lib/browser';
import fs from 'fs';

async function run() {
  try {
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();
    
    console.log("Navigating to Telecharge true login page...");
    await page.goto('https://my.socialtoaster.com/st/campaign_login/?key=BROADWAY&source=iframe', { waitUntil: 'domcontentloaded' });
    
    console.log("Logging in...");
    await page.fill('#login_email', 'zhapiboge97@gmail.com');
    await page.fill('#password', '@Vy#pNVD96rnK!i');
    
    // Click the actual login button
    await page.click('#login_form #get-started-button');
    
    console.log("Waiting for network idle or 10 seconds...");
    console.log("Waiting for network idle or 10 seconds...");
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 });
    } catch(e) {
      console.log("Wait timeout.");
    }
    
    console.log("Navigating to actual lottery page...");
    await page.goto('https://my.socialtoaster.com/st/lottery_select/?key=BROADWAY&source=iframe', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    const html = await page.content();
    fs.writeFileSync('telecharge-dashboard-loggedin.html', html);
    await page.screenshot({ path: 'telecharge-dashboard-loggedin.png', fullPage: true });
    
    console.log("Saved logged-in dashboard html!");
    await browser.close();
  } catch (error) {
    console.error("Failed:", error);
  }
}
run();

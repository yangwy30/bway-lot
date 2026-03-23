import * as fs from 'fs';
import * as cheerio from 'cheerio';

function extractBroadwayDirect(html: string) {
  const $ = cheerio.load(html);
  const shows: any[] = [];
  $('.content-card-default').each((i: any, el: any) => {
    const title = $(el).find('h4').text().trim();
    const priceText = $(el).find('.price').text().trim();
    const link = $(el).find('a.btn-show').attr('href');
    if (title && link) {
      shows.push({ site: 'BroadwayDirect', title, price: priceText, link });
    }
  });
  return shows;
}

function extractLuckySeat(html: string) {
  const $ = cheerio.load(html);
  const shows: any[] = [];
  $('.showBlockParent').each((i: any, el: any) => {
    const title = $(el).find('h3').text().trim();
    const city = $(el).find('.showBlockChild').eq(1).find('p').text().trim();
    const priceText = $(el).find('.text-brand').text().trim();
    if (title) {
      shows.push({ site: 'LuckySeat', title, city, price: priceText });
    }
  });
  return shows;
}

const bdHtml = fs.readFileSync('broadwaydirect.html', 'utf-8');
console.log('--- BroadwayDirect Shows ---');
console.log(extractBroadwayDirect(bdHtml).slice(0, 5));

const lsHtml = fs.readFileSync('luckyseat.html', 'utf-8');
console.log('\n--- LuckySeat Shows ---');
console.log(extractLuckySeat(lsHtml).slice(0, 5));

function extractTelecharge(html: string) {
  const $ = cheerio.load(html);
  const shows: any[] = [];
  $('.lottery_show').each((i: any, el: any) => {
    const title = $(el).find('.lottery_show_title').text().trim();
    const date = $(el).find('.lottery_show_date').text().trim();
    const enterBtn = $(el).find('a.st_campaign_button').attr('onclick');
    const eventIdMatch = enterBtn ? enterBtn.match(/enter_event\((\d+)\)/) : null;
    const eventId = eventIdMatch ? eventIdMatch[1] : null;
    if (title && eventId) {
      if (!shows.find(s => s.title === title)) {
        shows.push({
          site: 'Telecharge',
          title,
          url: 'https://rush.telecharge.com/',
          performances: [{ date, eventId }]
        });
      } else {
        const show = shows.find(s => s.title === title);
        show.performances.push({ date, eventId });
      }
    }
  });
  return shows;
}

if (fs.existsSync('telecharge-dashboard-loggedin.html')) {
  const teleHtml = fs.readFileSync('telecharge-dashboard-loggedin.html', 'utf-8');
  console.log('\n--- Telecharge Shows ---');
  console.log(JSON.stringify(extractTelecharge(teleHtml), null, 2));
}

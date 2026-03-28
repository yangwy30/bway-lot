export interface Show {
  id: string;
  site: 'BroadwayDirect'|'LuckySeat'|'Telecharge';
  title: string;
  price?: string;
  link: string;
  image?: string;
  city?: string;
  performances?: Array<{
    date: string;
    eventId?: string;
  }>;
}

export const MOCK_SHOWS: Show[] = [
  // BroadwayDirect
  {
    id: 'bd-six',
    site: 'BroadwayDirect',
    title: 'SIX (NY)',
    price: '$30.00',
    link: 'https://lottery.broadwaydirect.com/show/six-ny/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/134931-3.jpg',
  },
  {
    id: 'bd-1',
    site: 'BroadwayDirect',
    title: 'ALADDIN',
    price: '$35.00',
    link: 'https://lottery.broadwaydirect.com/show/aladdin/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/135824-5.jpg',
  },
  {
    id: 'bd-2',
    site: 'BroadwayDirect',
    title: 'DEATH BECOMES HER',
    price: '$45.00',
    link: 'https://lottery.broadwaydirect.com/show/dbh-nyc/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/138691-3.jpg',
  },
  {
    id: 'bd-3',
    site: 'BroadwayDirect',
    title: 'MJ (NY)',
    price: '$49.00',
    link: 'https://lottery.broadwaydirect.com/show/mj-ny/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/136006-3.jpg',
  },
  {
    id: 'bd-4',
    site: 'BroadwayDirect',
    title: 'WICKED',
    price: '$50.00',
    link: 'https://lottery.broadwaydirect.com/show/wicked/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/136293-7.jpg',
  },
  {
    id: 'bd-5',
    site: 'BroadwayDirect',
    title: 'HAMILTON',
    price: '$10.00',
    link: 'https://lottery.broadwaydirect.com/show/hamilton/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/138369-3.jpg',
  },
  {
    id: 'bd-6',
    site: 'BroadwayDirect',
    title: 'THE LION KING',
    price: '$35.00',
    link: 'https://lottery.broadwaydirect.com/show/the-lion-king/',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/135756-5.jpg',
  },
  // LuckySeat
  {
    id: 'ls-1',
    site: 'LuckySeat',
    title: 'The Outsiders',
    city: 'New York',
    price: '$47.00',
    link: 'https://www.luckyseat.com/shows/theoutsiders-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/127494-7.jpg',
  },
  {
    id: 'ls-2',
    site: 'LuckySeat',
    title: 'Hadestown',
    city: 'New York',
    price: '$49.00',
    link: 'https://www.luckyseat.com/shows/hadestown-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/133959-3.jpg',
  },
  {
    id: 'ls-3',
    site: 'LuckySeat',
    title: 'The Book of Mormon',
    city: 'New York',
    price: '$49.00',
    link: 'https://www.luckyseat.com/shows/thebookofmormon-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/138478-3.jpg',
  },
  {
    id: 'ls-4',
    site: 'LuckySeat',
    title: 'Moulin Rouge! The Musical',
    city: 'New York',
    price: '$49.00',
    link: 'https://www.luckyseat.com/shows/moulinrouge-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/126327-9.jpg',
  },
  {
    id: 'ls-5',
    site: 'LuckySeat',
    title: 'Every Brilliant Thing',
    city: 'New York',
    price: '$45.00',
    link: 'https://www.luckyseat.com/shows/everybrilliantthing-newyork',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/137299-5.jpg',
  },
  // Telecharge (all 17 shows from SocialToaster dashboard)
  {
    id: 'tc-arthur-millers-death-of-a-salesman',
    site: 'Telecharge',
    title: "Arthur Miller's Death of a Salesman",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139556-3.jpg',
  },
  {
    id: 'tc-cats-the-jellicle-ball',
    site: 'Telecharge',
    title: "CATS: The Jellicle Ball",
    link: 'https://rush.telecharge.com/',
    price: '$44.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139501-3.jpg',
  },
  {
    id: 'tc-chess',
    site: 'Telecharge',
    title: "Chess",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139547-3.jpg',
  },
  {
    id: 'tc-jamie-allans-amaze',
    site: 'Telecharge',
    title: "Jamie Allan's Amaze",
    link: 'https://rush.telecharge.com/',
    price: '$45.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/135399-3.jpg',
  },
  {
    id: 'tc-maybe-happy-ending',
    site: 'Telecharge',
    title: "Maybe Happy Ending",
    link: 'https://rush.telecharge.com/',
    price: '$49.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139195-3.jpg',
  },
  {
    id: 'tc-night-side-songs',
    site: 'Telecharge',
    title: "Night Side Songs",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139454-3.jpg',
  },
  {
    id: 'tc-operation-mincemeat-a-new-musical',
    site: 'Telecharge',
    title: "Operation Mincemeat: A New Musical",
    link: 'https://rush.telecharge.com/',
    price: '$49.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/132657-3.jpg',
  },
  {
    id: 'tc-ragtime',
    site: 'Telecharge',
    title: "Ragtime",
    link: 'https://rush.telecharge.com/',
    price: '$49.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/136295-3.png',
  },
  {
    id: 'tc-the-fear-of-13',
    site: 'Telecharge',
    title: "The Fear of 13",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139534-3.jpg',
  },
  {
    id: 'tc-the-great-gatsby',
    site: 'Telecharge',
    title: "The Great Gatsby",
    link: 'https://rush.telecharge.com/',
    price: '$44.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/134424-3.jpg',
  },
  {
    id: 'tc-the-outsiders',
    site: 'Telecharge',
    title: "The Outsiders",
    link: 'https://rush.telecharge.com/',
    price: '$44.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/127494-7.jpg',
  },
  {
    id: 'tc-two-strangers-carry-a-cake-across-new-york',
    site: 'Telecharge',
    title: "Two Strangers (Carry a Cake Across New York)",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139366-3.jpg',
  },
  {
    id: 'tc-oh-mary',
    site: 'Telecharge',
    title: "Oh, Mary!",
    link: 'https://rush.telecharge.com/',
    price: '$44.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139474-3.jpg',
  },
  {
    id: 'tc-beaches-a-new-musical',
    site: 'Telecharge',
    title: "Beaches, A New Musical",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139494-3.jpg',
  },
  {
    id: 'tc-heathers',
    site: 'Telecharge',
    title: "Heathers",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/139544-3.jpg',
  },
  {
    id: 'tc-little-shop-of-horrors',
    site: 'Telecharge',
    title: "Little Shop of Horrors",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/133189-3.jpg',
  },
  {
    id: 'tc-the-play-that-goes-wrong',
    site: 'Telecharge',
    title: "The Play That Goes Wrong",
    link: 'https://rush.telecharge.com/',
    price: '$39.00',
    image: 'https://imaging.broadway.com/images/poster-178275/w230/222222/128330-3.jpg',
  }
];


// --- Live show fetching with background caching ---

import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'shows_cache.json');
let cachedShows: Show[] | null = null;
let lastScrapeTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for background refresh
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes to trigger background scrape
let scrapeInProgress = false;

/**
 * Returns combined show list immediately (from memory or file cache).
 * Triggers a background scrape if the cache is stale or missing.
 */
export async function getShows(): Promise<Show[]> {
  const now = Date.now();

  // 1. Initial Load from file if memory is empty
  if (!cachedShows && fs.existsSync(CACHE_FILE)) {
    try {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      cachedShows = parsed.shows;
      lastScrapeTime = parsed.timestamp;
      console.log(`[getShows] Loaded ${cachedShows?.length} shows from persistent cache.`);
    } catch (e) {
      console.error('[getShows] Error reading cache file:', e);
    }
  }

  // 2. Return what we have immediately
  const showsToReturn = cachedShows || MOCK_SHOWS;

  // 3. Trigger background scrape if needed
  if (!scrapeInProgress && (now - lastScrapeTime > STALE_THRESHOLD_MS || !cachedShows)) {
    triggerBackgroundScrape().catch(console.error);
  }

  return showsToReturn;
}

/**
 * Background worker that performs the slow scrape operation
 */
async function triggerBackgroundScrape() {
  if (scrapeInProgress) return;
  scrapeInProgress = true;
  console.log('[getShows] Starting background Telecharge scrape...');

  try {
    const { scrapeRushTelecharge } = await import('./scrapers/index');
    const liveTelechargeShows = await scrapeRushTelecharge();

    // Non-Telecharge shows from MOCK_SHOWS
    const otherShows = MOCK_SHOWS.filter((s) => s.site !== 'Telecharge');

    let telechargeShows: Show[];
    if (liveTelechargeShows.length > 0) {
      telechargeShows = liveTelechargeShows;
    } else {
      console.log('[getShows] Live scrape returned 0 shows, using hardcoded fallback.');
      telechargeShows = MOCK_SHOWS.filter((s) => s.site === 'Telecharge');
    }

    // Deduplicate and normalize IDs
    const seenTitles = new Set<string>();
    const deduped: Show[] = [];
    for (const show of telechargeShows) {
      const key = show.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        const slug = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        show.id = `tc-${slug}`;
        deduped.push(show);
      }
    }

    const combined = [...otherShows, ...deduped];
    cachedShows = combined;
    lastScrapeTime = Date.now();

    // Persist to file
    if (!fs.existsSync(path.dirname(CACHE_FILE))) {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: lastScrapeTime,
      shows: combined
    }, null, 2));

    console.log(`[getShows] Background scrape complete. Cached ${combined.length} shows.`);
  } catch (error: any) {
    console.error('[getShows] Background scrape failed:', error.message);
    // Keep using what we have (cachedShows or MOCK_SHOWS)
    if (!cachedShows) cachedShows = MOCK_SHOWS;
    lastScrapeTime = Date.now(); // Still update timestamp to avoid infinite retry loops if we want
  } finally {
    scrapeInProgress = false;
  }
}


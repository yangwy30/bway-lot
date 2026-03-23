import { Show } from '../types';

export async function scrapeBroadwayDirect(): Promise<Show[]> {
  // TODO: implement playwright extraction
  return [];
}

export async function scrapeRushTelecharge(): Promise<Show[]> {
  // TODO: implement playwright extraction
  return [];
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

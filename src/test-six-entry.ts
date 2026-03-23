import { AutomationEngine } from './lib/automation/engine';
import { Show } from './lib/mock-data';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SIX_NY: Show = {
  id: 'bd-six',
  title: 'SIX',
  site: 'BroadwayDirect',
  link: 'https://lottery.broadwaydirect.com/show/six-ny/',
  imageUrl: '',
  siteUrl: 'https://lottery.broadwaydirect.com',
  description: 'SIX the Musical lottery',
  status: 'Open'
};

async function main() {
  console.log('🎭 Starting BroadwayDirect entry for SIX (NY) with CapSolver auto-bypass...\n');

  const engine = new AutomationEngine();
  const profiles = engine.getProfiles();

  if (profiles.length === 0) {
    console.error('❌ No profiles found in data/profiles.json');
    process.exit(1);
  }

  const profile = profiles[0];
  console.log(`👤 Using profile: ${profile.firstName} ${profile.lastName} (${profile.email})`);
  console.log(`🎯 Show: ${SIX_NY.title} on ${SIX_NY.site}`);
  console.log(`🔗 URL: ${SIX_NY.link}\n`);

  const results = await engine.runBatchSubmission(SIX_NY, [profile]);

  console.log('\n--- Final Results ---');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);

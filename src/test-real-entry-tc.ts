import { AutomationEngine } from './lib/automation/engine';
import { MOCK_SHOWS } from './lib/show-data';

async function testTelechargeEntry() {
  const engine = new AutomationEngine();
  // Find a Telecharge show
  const show = MOCK_SHOWS.find(s => s.site === 'Telecharge');
  const profiles = engine.getProfiles('test');
  
  if (!show || profiles.length === 0) {
    console.error('Telecharge show or profiles not found!');
    return;
  }

  console.log(`🚀 Starting real entry test for ${profiles[0].firstName} for ${show.title} (Telecharge)...`);
  
  try {
    const results = await engine.runBatchSubmission(show, [profiles[0]], '');
    console.log('Final Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('FATAL TEST ERROR:', error);
  }
}

testTelechargeEntry();

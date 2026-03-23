import { AutomationEngine } from './lib/automation/engine';
import { MOCK_SHOWS } from './lib/mock-data';

async function testRealEntry() {
  const engine = new AutomationEngine();
  const aladdin = MOCK_SHOWS.find(s => s.id === 'bd-1');
  const profiles = engine.getProfiles();
  
  if (!aladdin || profiles.length === 0) {
    console.error('Aladdin show or profiles not found!');
    return;
  }

  console.log(`🚀 Starting real entry test for ${profiles[0].firstName} for ${aladdin.title}...`);
  
  try {
    const results = await engine.runBatchSubmission(aladdin, [profiles[0]]);
    console.log('Final Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('FATAL TEST ERROR:', error);
  }
}

testRealEntry();

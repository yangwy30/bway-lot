import { BroadwayDirectSubmitter } from './lib/automation/broadway-direct';
import { MOCK_SHOWS } from './lib/mock-data';
import { Profile } from './lib/automation/types';

async function testBroadwayDirect() {
  const submitter = new BroadwayDirectSubmitter();
  
  // Find Aladdin
  const aladdin = MOCK_SHOWS.find(s => s.title === 'ALADDIN');
  if (!aladdin) {
    console.error('Aladdin not found in mock data');
    return;
  }

  const testProfile: Profile = {
    id: 'test-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'your-email@example.com', // Replace with your email
    phone: '2125550123',
    zipCode: '10001',
    dob: {
      month: '01',
      day: '01',
      year: '1990'
    }
  };

  try {
    const result = await submitter.submitEntry(aladdin, testProfile);
    console.log('Test Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testBroadwayDirect();

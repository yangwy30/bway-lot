import { startScheduler } from './lib/automation/scheduler';

console.log('--- Broadway Lottery Automation Server ---');
startScheduler();

// Keep the process alive
process.stdin.resume();

import { NextResponse } from 'next/server';
import { AutomationEngine } from '@/lib/automation/engine';
import { MOCK_SHOWS } from '@/lib/show-data';
import { logger } from '@/lib/logger';
import { getUserId } from '@/lib/auth';

export async function POST() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const engine = new AutomationEngine();
    const enrollments = engine.getEnrollments(userId);
    const profiles = engine.getProfiles(userId);
    
    if (profiles.length === 0) {
      return NextResponse.json({ error: 'No profiles found' }, { status: 400 });
    }

    logger.clear();
    AutomationEngine.reset();
    const activeEnrollments = enrollments.filter(e => e.active);
    logger.log(`Triggering manual run for ${activeEnrollments.length} active enrollments...`, 'info');
    
    // Await execution to prevent Next.js from closing the execution context early
    try {
      for (const enrollment of activeEnrollments) {
        const show = MOCK_SHOWS.find(s => s.id === enrollment.showId);
        if (!show) {
           logger.log(`Show ${enrollment.showId} not found in catalog.`, 'warning');
           continue;
        }
        
        // Find matching profiles
        const selectedProfiles = profiles.filter(p => enrollment.profileIds.includes(p.id));
        if (selectedProfiles.length > 0) {
           await engine.runBatchSubmission(show, selectedProfiles);
        } else {
           logger.log(`No profiles found for enrollment ${show.title}.`, 'warning');
        }
        if ((AutomationEngine as any).isStopped) {
           logger.log('Automation halted by user request.', 'warning');
           break;
        }
      }
      const isStopped = (AutomationEngine as any).isStopped;
      logger.log(isStopped ? 'Operation cancelled.' : 'All operations completed successfully.', isStopped ? 'warning' : 'success');
    } catch (err: any) {
      logger.log(`Engine execution error: ${err.message}`, 'error');
    }

    return NextResponse.json({ success: true, message: 'Automation engine triggered' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

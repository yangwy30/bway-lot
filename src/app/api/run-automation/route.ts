import { NextResponse } from 'next/server';
import { AutomationEngine } from '@/lib/automation/engine';
import { getShows } from '@/lib/show-data';
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

    // Kill any previous running automation before starting a new one
    AutomationEngine.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for previous to halt
    
    logger.clear();
    const sessionId = AutomationEngine.startSession();
    const activeEnrollments = enrollments.filter(e => e.active);
    logger.log(`Triggering manual run for ${activeEnrollments.length} active enrollments... (Session: ${sessionId})`, 'info');
    
    // Fetch live show data
    const allShows = await getShows();
 
     // Await execution to prevent Next.js from closing the execution context early
     try {
       for (const enrollment of activeEnrollments) {
         if (AutomationEngine.currentSessionId !== sessionId) break;

         const show = allShows.find(s => s.id === enrollment.showId);
         if (!show) {
            logger.log(`Show ${enrollment.showId} not found in catalog.`, 'warning');
            continue;
         }
         
         // Find matching profiles
         const selectedProfiles = profiles.filter(p => enrollment.profileIds.includes(p.id));
         if (selectedProfiles.length > 0) {
            await engine.runBatchSubmission(show, selectedProfiles, sessionId);
         } else {
            logger.log(`No profiles found for enrollment ${show.title}.`, 'warning');
         }

         if (AutomationEngine.currentSessionId !== sessionId) {
            logger.log('Automation halted by user request or new session.', 'warning');
            break;
         }
       }
       const isStopped = AutomationEngine.currentSessionId !== sessionId;
       if (!isStopped) {
         logger.log('All operations completed successfully.', 'success');
       }
     } catch (err: any) {
       if (AutomationEngine.currentSessionId === sessionId) {
         logger.log(`Engine execution error: ${err.message}`, 'error');
       }
     }

    return NextResponse.json({ success: true, message: 'Automation engine triggered' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

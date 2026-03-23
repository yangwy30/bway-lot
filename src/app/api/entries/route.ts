import { NextResponse } from 'next/server';
import { AutomationEngine } from '@/lib/automation/engine';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const engine = new AutomationEngine();
  return NextResponse.json(engine.getEntryLog(userId));
}

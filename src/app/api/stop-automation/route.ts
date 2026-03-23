import { NextResponse } from 'next/server';
import { AutomationEngine } from '@/lib/automation/engine';
import { getUserId } from '@/lib/auth';

export async function POST() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    AutomationEngine.stop();
    return NextResponse.json({ success: true, message: 'Stop signal sent' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

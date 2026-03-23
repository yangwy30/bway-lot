import { NextResponse, NextRequest } from 'next/server';
import { AutomationEngine, Enrollment } from '@/lib/automation/engine';
import { getUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const engine = new AutomationEngine();
    
    const enrollment: Enrollment = { ...data, userId };
    engine.saveEnrollment(enrollment);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const engine = new AutomationEngine();
  return NextResponse.json(engine.getEnrollments(userId));
}

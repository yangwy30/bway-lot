import { NextRequest, NextResponse } from 'next/server';
import { AutomationEngine } from '@/lib/automation/engine';
import { Profile } from '@/lib/automation/types';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const engine = new AutomationEngine();
  return NextResponse.json(engine.getProfiles(userId));
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile: Profile = await request.json();
    const engine = new AutomationEngine();
    
    if (!profile.id) profile.id = 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    
    engine.saveProfile({ ...profile, userId } as Profile & { userId: string });
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('ID required');
    
    const engine = new AutomationEngine();
    engine.deleteProfile(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (token) {
    const sessionsPath = path.join(process.cwd(), 'data', 'sessions.json');
    if (fs.existsSync(sessionsPath)) {
      try {
        const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
        delete sessions[token];
        fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete('auth_token');
  return res;
}

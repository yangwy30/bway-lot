import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    if (!fs.existsSync(usersPath)) {
      return NextResponse.json({ error: 'DB not found' }, { status: 500 });
    }
    
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = users.find((u: any) => u.username === username);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    
    const hash = crypto.createHash('sha512').update(password).digest('hex');
    if (user.passwordHash !== hash) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    
    // Create simple session token
    const token = crypto.randomUUID();
    const sessionsPath = path.join(process.cwd(), 'data', 'sessions.json');
    let sessions: Record<string, string> = {};
    if (fs.existsSync(sessionsPath)) {
      sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
    }
    sessions[token] = user.id;
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));

    const res = NextResponse.json({ success: true, userId: user.id });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

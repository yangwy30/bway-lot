import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return null;
  
  const sessionsPath = path.join(process.cwd(), 'data', 'sessions.json');
  if (!fs.existsSync(sessionsPath)) return null;
  
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
    return sessions[token] || null;
  } catch (err) {
    return null;
  }
}

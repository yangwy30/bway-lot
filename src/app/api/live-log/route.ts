import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  return NextResponse.json(logger.getLogs());
}

import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'data', 'live-log.json');

export interface LogMessage {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'error' | 'warning';
}

export class LiveLogger {
  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    const dir = path.dirname(LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  getLogs(): LogMessage[] {
    if (!fs.existsSync(LOG_PATH)) return [];
    try {
      return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    } catch {
      return [];
    }
  }

  log(message: string, level: LogMessage['level'] = 'info') {
    const logs = this.getLogs();
    
    // Add new log to the end
    logs.push({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      message,
      level
    });

    // Keep only last 50 logs
    const trimmed = logs.slice(-50);
    
    fs.writeFileSync(LOG_PATH, JSON.stringify(trimmed, null, 2));
    
    // Also output to server console
    const color = level === 'error' ? '\x1b[31m' : level === 'success' ? '\x1b[32m' : level === 'warning' ? '\x1b[33m' : '\x1b[36m';
    console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`);
  }

  clear() {
    fs.writeFileSync(LOG_PATH, JSON.stringify([]));
  }
}

// Global singleton logger
export const logger = new LiveLogger();

import fs from 'fs';
import path from 'path';

const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY || '';
const CAPSOLVER_API_URL = 'https://api.capsolver.com';

interface TaskResult {
  token: string;
}

export class BotSolver {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || CAPSOLVER_API_KEY;
    if (!this.apiKey) {
      throw new Error('[BotSolver] CAPSOLVER_API_KEY is not set. Please set it in .env.local');
    }
  }

  /**
   * Solve a bot challenge (Turnstile or reCAPTCHA).
   * @param pageUrl - The URL of the page with the challenge.
   * @param siteKey - The siteKey found on the page.
   * @param type - 'turnstile' or 'recaptcha'.
   * @returns The solved token string.
   */
  async solve(pageUrl: string, siteKey: string, type: 'turnstile' | 'recaptcha' = 'turnstile'): Promise<string> {
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        if (retry > 0) {
          console.log(`[BotSolver] 🔄 Retry ${retry}/${maxRetries - 1} for ${type}...`);
          await this.sleep(5000 * retry); // Exponential backoff
        }

        console.log(`[BotSolver] Creating ${type} task for siteKey=${siteKey.substring(0, 12)}...`);
        const taskType = type === 'turnstile' ? 'AntiTurnstileTaskProxyLess' : 'ReCaptchaV2TaskProxyLess';

        const createRes = await fetch(`${CAPSOLVER_API_URL}/createTask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientKey: this.apiKey,
            task: {
              type: taskType,
              websiteURL: pageUrl,
              websiteKey: siteKey,
            }
          })
        });

        const createData = await createRes.json();
        if (createData.errorId !== 0) {
          throw new Error(`[BotSolver] Create task failed: ${createData.errorDescription || JSON.stringify(createData)}`);
        }

        const taskId = createData.taskId;
        console.log(`[BotSolver] Task created: ${taskId}. Polling for result...`);

        for (let attempt = 0; attempt < 40; attempt++) {
          await this.sleep(3000); 

          const resultRes = await fetch(`${CAPSOLVER_API_URL}/getTaskResult`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientKey: this.apiKey,
              taskId
            })
          });

          const resultData = await resultRes.json();

          if (resultData.status === 'ready') {
            const token = type === 'turnstile' ? resultData.solution?.token : resultData.solution?.gRecaptchaResponse;
            if (!token) throw new Error(`[BotSolver] No token in solution for ${type}`);
            console.log(`[BotSolver] ✅ Solved in ${attempt + 1} polls.`);
            return token;
          }

          if (resultData.status === 'failed') {
            throw new Error(`[BotSolver] Task failed: ${resultData.errorDescription}`);
          }

          if (attempt % 5 === 0) {
            console.log(`[BotSolver] Poll ${attempt + 1}/40: ${resultData.status}`);
          }
        }

        throw new Error(`[BotSolver] ❌ Timeout: 40 polls exceeded for ${type}.`);
      } catch (err: any) {
        lastError = err;
        console.log(`[BotSolver] ⚠️ Attempt ${retry + 1} failed: ${err.message}`);
        if (err.message.includes('API_KEY')) break;
      }
    }

    throw lastError || new Error(`[BotSolver] ❌ Failed to solve ${type} after ${maxRetries} attempts.`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

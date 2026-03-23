import fs from 'fs';
import path from 'path';

const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY || '';
const CAPSOLVER_API_URL = 'https://api.capsolver.com';

interface TaskResult {
  token: string;
}

export class TurnstileSolver {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || CAPSOLVER_API_KEY;
    if (!this.apiKey) {
      throw new Error('[TurnstileSolver] CAPSOLVER_API_KEY is not set. Please set it in .env.local');
    }
  }

  /**
   * Solve a Cloudflare Turnstile challenge.
   * @param siteKey - The Turnstile siteKey found on the page.
   * @param pageUrl - The URL of the page with the challenge.
   * @returns The solved token string.
   */
  async solve(siteKey: string, pageUrl: string): Promise<string> {
    console.log(`[TurnstileSolver] Creating task for siteKey=${siteKey.substring(0, 12)}...`);

    // Step 1: Create the task
    const createRes = await fetch(`${CAPSOLVER_API_URL}/createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: this.apiKey,
        task: {
          type: 'AntiTurnstileTaskProxyLess',
          websiteURL: pageUrl,
          websiteKey: siteKey,
        }
      })
    });

    const createData = await createRes.json();
    if (createData.errorId !== 0) {
      throw new Error(`[TurnstileSolver] Create task failed: ${createData.errorDescription || JSON.stringify(createData)}`);
    }

    const taskId = createData.taskId;
    console.log(`[TurnstileSolver] Task created: ${taskId}. Polling for result...`);

    // Step 2: Poll for the result
    for (let attempt = 0; attempt < 30; attempt++) {
      await this.sleep(3000); // Wait 3 seconds between polls

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
        const token = resultData.solution?.token;
        if (!token) throw new Error('[TurnstileSolver] No token in solution');
        console.log(`[TurnstileSolver] ✅ Solved in ${attempt + 1} polls.`);
        return token;
      }

      if (resultData.status === 'failed') {
        throw new Error(`[TurnstileSolver] Task failed: ${resultData.errorDescription}`);
      }

      // Still processing...
      console.log(`[TurnstileSolver] Poll ${attempt + 1}/30: ${resultData.status}`);
    }

    throw new Error('[TurnstileSolver] ❌ Timeout: 30 polls exceeded.');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

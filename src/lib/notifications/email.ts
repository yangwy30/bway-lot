import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Default to a mockup/sandbox transporter if env vars are missing
    // In production, user will provide SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'mock-user@ethereal.email',
        pass: process.env.SMTP_PASS || 'mock-password',
      },
    });
  }

  async sendEmail(options: EmailOptions) {
    // If no real SMTP is configured, log to file for development
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'mock-user@ethereal.email') {
      const logDir = path.join(process.cwd(), 'logs', 'notifications');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      
      const filename = `email-${Date.now()}-${options.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      const filepath = path.join(logDir, filename);
      
      fs.writeFileSync(filepath, options.html);
      console.log(`[Email] [DEV MODE] Saved email to ${filepath}`);
      return { messageId: 'local-file-' + Date.now() };
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"BwayLot Automation" <notifications@bwaylot.com>',
        ...options
      });
      console.log(`[Email] Message sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('[Email] Failed to send email:', error);
      throw error;
    }
  }

  // Template generators
  generateEntryConfirmationHTML(showTitle: string, profileName: string): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px;">Entered! 🎟️</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">Good news, <strong>${profileName}</strong>. We've successfully submitted your entry for <strong>${showTitle}</strong>.</p>
        <div style="margin-top: 32px; padding: 24px; background: #f9f9fb; border-radius: 16px;">
          <p style="margin: 0; font-size: 14px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Show</p>
          <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700;">${showTitle}</p>
        </div>
        <p style="margin-top: 40px; font-size: 12px; color: #aaa;">This is an automated notification from BwayLot. You'll receive another update if a win is detected.</p>
      </div>
    `;
  }

  generateResultHTML(showTitle: string, won: boolean): string {
    const title = won ? "YOU WON! 🎉" : "Better Luck Next Time";
    const color = won ? "#ff385c" : "#666";
    const body = won 
        ? `Pack your bags! You've won tickets to <strong>${showTitle}</strong>. Check your email for the purchase link ASAP—winners usually have a very limited window!`
        : `We checked the results for <strong>${showTitle}</strong> but unfortunately you weren't selected this time. We've already got you queued for the next one!`;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; color: ${color};">${title}</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">${body}</p>
        <div style="margin-top: 32px; padding: 24px; background: #f9f9fb; border-radius: 16px;">
          <p style="margin: 0; font-size: 14px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Show</p>
          <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700;">${showTitle}</p>
        </div>
      </div>
    `;
  }

  generateSummaryHTML(entries: { showTitle: string; success: boolean; message: string }[]): string {
    const successCount = entries.filter(e => e.success).length;
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px;">Daily Summary</h1>
        <p style="color: #888; font-size: 14px; margin-bottom: 32px;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div style="font-size: 32px; font-weight: 800; margin-bottom: 32px;">
          ${successCount} <span style="font-size: 16px; font-weight: 500; color: #888;">Successful Entries</span>
        </div>

        <ul style="list-style: none; padding: 0; margin: 0;">
          ${entries.map(e => `
            <li style="padding: 16px 0; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="margin: 0; font-size: 16px; font-weight: 600;">${e.showTitle}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: ${e.success ? '#22c55e' : '#ef4444'};">${e.success ? 'Confirmed' : 'Failed'}</p>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
}

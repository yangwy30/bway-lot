import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/notifications/email';

export async function POST() {
  try {
    const emailService = new EmailService();
    await emailService.sendEmail({
      to: 'user@example.com', // In a real app, this would be the logged-in user's email
      subject: 'Test Notification from BwayLot 🎭',
      html: emailService.generateEntryConfirmationHTML('Hamilton', 'Yang')
    });
    return NextResponse.json({ success: true, message: 'Test email sent' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { EmailService } from './lib/notifications/email';

async function testNotifications() {
  const emailService = new EmailService();

  console.log('--- Testing Entry Confirmation ---');
  await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Entered! 🎟️ Hamilton',
    html: emailService.generateEntryConfirmationHTML('Hamilton', 'Yang')
  }).then(() => console.log('✅ Entry Confirmation Sent'))
    .catch(err => console.log('❌ Failed:', err.message));

  console.log('\n--- Testing Win Notification ---');
  await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'YOU WON! 🎉 Aladdin',
    html: emailService.generateResultHTML('Aladdin', true)
  }).then(() => console.log('✅ Win Notification Sent'))
    .catch(err => console.log('❌ Failed:', err.message));

  console.log('\n--- Testing Daily Summary ---');
  await emailService.sendEmail({
    to: 'test@example.com',
    subject: 'Daily Lottery Summary',
    html: emailService.generateSummaryHTML([
      { showTitle: 'Hamilton', success: true, message: 'Confirmed' },
      { showTitle: 'Wicked', success: true, message: 'Confirmed' },
      { showTitle: 'Aladdin', success: false, message: 'Login Required' }
    ])
  }).then(() => console.log('✅ Daily Summary Sent'))
    .catch(err => console.log('❌ Failed:', err.message));
}

testNotifications();

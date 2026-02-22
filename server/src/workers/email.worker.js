import { Worker } from 'bullmq';
import { transporter } from '../config/mailer.js';
import { ENV } from '../config/env.js';

const connection = {
  url: ENV.REDIS_URL,
  ...(ENV.NODE_ENV === 'production' && { tls: {} }),
};

const emailWorker = new Worker(
  'email',
  async (job) => {
    const { type, to, data } = job.data;

    let mailOptions;

    switch (type) {
      case 'BOOKING_CONFIRMATION':
        mailOptions = {
          from: `"CineBook" <${process.env.GMAIL_USER}>`,
          to,
          subject: `Booking Confirmed — ${data.movieTitle}`,
          html: bookingConfirmationTemplate(data),
        };
        break;

      case 'BOOKING_CANCELLATION':
        mailOptions = {
          from: `"CineBook" <${process.env.GMAIL_USER}>`,
          to,
          subject: `Booking Cancelled — ${data.movieTitle}`,
          html: bookingCancellationTemplate(data),
        };
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent [${type}] to ${to}`);
  },
  {
    connection,
    concurrency: 5, // process 5 emails at a time
    skipVersionCheck: true,
  }
);

emailWorker.on('completed', (job) => console.log(`✅ Email job ${job.id} done`));
emailWorker.on('failed', (job, err) => console.error(`❌ Email job ${job.id} failed:`, err.message));

export default emailWorker;

// ─── Email Templates ────────────────────────────────────────────────────────

const bookingConfirmationTemplate = (data) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
    <h2 style="color: #e50914;">🎬 Booking Confirmed!</h2>
    <p>Hi <strong>${data.userName}</strong>, your booking is confirmed.</p>
    <hr/>
    <table style="width:100%; border-collapse: collapse;">
      <tr><td><strong>Movie</strong></td><td>${data.movieTitle}</td></tr>
      <tr><td><strong>Theatre</strong></td><td>${data.theatreName}</td></tr>
      <tr><td><strong>Screen</strong></td><td>${data.screenName}</td></tr>
      <tr><td><strong>Date & Time</strong></td><td>${data.showTime}</td></tr>
      <tr><td><strong>Seats</strong></td><td>${data.seats.join(', ')}</td></tr>
      <tr><td><strong>Total Paid</strong></td><td>₹${data.totalAmount}</td></tr>
      <tr><td><strong>Booking ID</strong></td><td>${data.bookingId}</td></tr>
    </table>
    <hr/>
    <p style="color: #888; font-size: 12px;">Thank you for booking with CineBook!</p>
  </div>
`;

const bookingCancellationTemplate = (data) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
    <h2 style="color: #333;">Booking Cancelled</h2>
    <p>Hi <strong>${data.userName}</strong>, your booking has been cancelled.</p>
    <p><strong>Booking ID:</strong> ${data.bookingId}</p>
    <p><strong>Movie:</strong> ${data.movieTitle}</p>
    <p>If you paid, your refund will be processed within 5-7 business days.</p>
  </div>
`;
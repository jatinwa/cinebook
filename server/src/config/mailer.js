import nodemailer from 'nodemailer';
import { ENV } from './env.js';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your real password)
  },
});

transporter.verify((err) => {
  if (err) console.error('❌ Mailer error:', err);
  else console.log('✅ Mailer ready');
});

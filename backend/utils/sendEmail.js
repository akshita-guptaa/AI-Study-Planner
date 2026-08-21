const axios = require('axios');

/**
 * Send an email via Resend's HTTP API (not SMTP — required because
 * Render's free tier blocks outbound SMTP ports 25/465/587).
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - HTML body
 */
const sendEmail = async ({ to, subject, html }) => {
  await axios.post(
    'https://api.resend.com/emails',
    {
      from: 'AI Study Planner <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

module.exports = sendEmail;

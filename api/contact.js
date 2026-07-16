const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = 'sindhuharish2802@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are all required.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: TO_EMAIL,
      replyTo: email,
      subject: `New portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: 'Failed to send message. Please try again later.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form send failed:', err);
    return res.status(502).json({ error: 'Failed to send message. Please try again later.' });
  }
};

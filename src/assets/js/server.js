// ~/vulpinemsp/backend/routes/server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // tighten in prod

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: (process.env.SMTP_SECURE || 'true') !== 'false',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const MAIL_TO = process.env.MAIL_TO || 'contact@vulpinemsp.com';
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@vulpinemsp.com';

app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, company, phone, extension, message } = req.body;
    await transporter.sendMail({
      from: `"VulpineMSP.com Contact Form" <${MAIL_FROM}>`,
      to: MAIL_TO,
      subject: `New Website Contact: ${firstName} ${lastName} (${company})`,
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nCompany: ${company}\nPhone: ${phone}\nExt: ${extension || ""}\n\n${message}\n`
    });
    res.status(202).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not send email.' });
  }
});

app.get('/api/health', (_req, res) => res.status(200).send('ok'));
app.get('/health', (_req, res) => res.status(200).send('ok'));
app.listen(parseInt(process.env.PORT || '3001', 10), '0.0.0.0', () => {
  console.log('Contact form API listening on 0.0.0.0:' + (process.env.PORT || '3001'));
});
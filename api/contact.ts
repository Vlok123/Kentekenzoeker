import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://carintel.nl',
    'https://www.carintel.nl',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.carintel.nl');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message }: ContactFormData = req.body;

    // Validatie
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Alle velden zijn verplicht' });
    }

    // Email validatie
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ongeldig email adres' });
    }

    // Email transporter instellen
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 10px 10px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #374151; }
          .value { background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #3b82f6; }
          .message-box { background: white; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚗 Nieuw Contact Bericht - CarIntel</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Van:</div>
              <div class="value">${name} (${email})</div>
            </div>
            
            <div class="field">
              <div class="label">Onderwerp:</div>
              <div class="value">${subject}</div>
            </div>
            
            <div class="field">
              <div class="label">Bericht:</div>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>💡 Tip:</strong> Antwoord direct op deze email om contact op te nemen met de verzender.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email naar CarIntel sturen
    await transporter.sendMail({
      from: `"CarIntel Contact" <${process.env.EMAIL_USER}>`,
      to: 'info@carintel.nl',
      replyTo: email,
      subject: `[CarIntel Contact] ${subject}`,
      html: htmlContent,
      text: `
Nieuw contact bericht van CarIntel website

Van: ${name} (${email})
Onderwerp: ${subject}

Bericht:
${message}

---
Dit bericht is verzonden via het contactformulier op de CarIntel website.
      `
    });

    // Bevestigings email naar verzender
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h2>Bericht ontvangen!</h2>
          </div>
          <div class="content">
            <p>Beste ${name},</p>
            
            <p>Bedankt voor je bericht! We hebben je contactformulier succesvol ontvangen.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <strong>📧 Je bericht details:</strong><br>
              <strong>Onderwerp:</strong> ${subject}<br>
              <strong>Verzonden op:</strong> ${new Date().toLocaleString('nl-NL')}
            </div>
            
            <p>Ons team bekijkt je bericht en we nemen binnen 24 uur contact met je op tijdens werkdagen.</p>
            
            <p>In de tussentijd kun je:</p>
            <ul>
              <li>🔍 Kentekens opzoeken op onze website</li>
              <li>📊 Trekgewicht controleren</li>
              <li>📱 Je favoriete voertuigen opslaan</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://carintel.nl" class="button">Terug naar CarIntel</a>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <strong>💡 Veel gestelde vragen?</strong><br>
              Bekijk onze FAQ sectie voor snelle antwoorden op veelgestelde vragen.
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Met vriendelijke groet,<br>
              Het CarIntel Team<br>
              📧 info@carintel.nl
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"CarIntel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bedankt voor je bericht - CarIntel',
      html: confirmationHtml,
      text: `
Beste ${name},

Bedankt voor je bericht! We hebben je contactformulier succesvol ontvangen.

Je bericht details:
- Onderwerp: ${subject}
- Verzonden op: ${new Date().toLocaleString('nl-NL')}

Ons team bekijkt je bericht en we nemen binnen 24 uur contact met je op tijdens werkdagen.

Met vriendelijke groet,
Het CarIntel Team
info@carintel.nl
      `
    });

    res.status(200).json({ success: true, message: 'Bericht succesvol verzonden' });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het versturen van je bericht' });
  }
} 
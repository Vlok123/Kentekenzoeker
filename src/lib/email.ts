import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@carintel.nl';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export class EmailService {
  // Generate a secure token
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send email verification
  static async sendEmailVerification(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
          .logo { color: #3b82f6; font-size: 24px; font-weight: bold; }
          .content { padding: 30px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CarIntel</div>
          </div>
          
          <div class="content">
            <h2>Welkom bij CarIntel${name ? `, ${name}` : ''}!</h2>
            
            <p>Bedankt voor het aanmaken van je account. Om je account te activeren, klik je op de onderstaande knop:</p>
            
            <a href="${verificationUrl}" class="button">Email bevestigen</a>
            
            <p>Je kunt ook deze link in je browser kopiëren:</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-wrap: break-word;">${verificationUrl}</p>
            
            <p><strong>Deze link is 24 uur geldig.</strong></p>
            
            <p>Als je dit account niet hebt aangemaakt, kun je deze email negeren.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 CarIntel - Je betrouwbare auto-informatie platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welkom bij CarIntel${name ? `, ${name}` : ''}!
      
      Bedankt voor het aanmaken van je account. Om je account te activeren, ga naar:
      ${verificationUrl}
      
      Deze link is 24 uur geldig.
      
      Als je dit account niet hebt aangemaakt, kun je deze email negeren.
      
      © 2024 CarIntel
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Bevestig je CarIntel account',
      html: htmlContent,
      text: textContent
    });
  }

  // Send password reset email
  static async sendPasswordReset(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
          .logo { color: #3b82f6; font-size: 24px; font-weight: bold; }
          .content { padding: 30px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CarIntel</div>
          </div>
          
          <div class="content">
            <h2>Wachtwoord resetten${name ? ` voor ${name}` : ''}</h2>
            
            <p>Je hebt een verzoek ingediend om je wachtwoord te resetten. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:</p>
            
            <a href="${resetUrl}" class="button">Nieuw wachtwoord instellen</a>
            
            <p>Je kunt ook deze link in je browser kopiëren:</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-wrap: break-word;">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Belangrijk:</strong>
              <ul>
                <li>Deze link is slechts 1 uur geldig</li>
                <li>De link kan maar één keer gebruikt worden</li>
                <li>Als je dit verzoek niet hebt ingediend, negeer dan deze email</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 CarIntel - Je betrouwbare auto-informatie platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Wachtwoord resetten${name ? ` voor ${name}` : ''}
      
      Je hebt een verzoek ingediend om je wachtwoord te resetten. Ga naar deze link om een nieuw wachtwoord in te stellen:
      ${resetUrl}
      
      BELANGRIJK:
      - Deze link is slechts 1 uur geldig
      - De link kan maar één keer gebruikt worden
      - Als je dit verzoek niet hebt ingediend, negeer dan deze email
      
      © 2024 CarIntel
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Wachtwoord resetten - CarIntel',
      html: htmlContent,
      text: textContent
    });
  }

  // Test email configuration
  static async testConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
} 
import nodemailer from 'nodemailer';

/**
 * Email Service using Gmail SMTP
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
      }
    });
  }

  /**
   * Send workspace invitation email
   */
  async sendInvitation({ to, workspaceName, inviterName, inviteToken, role }) {
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:8001'}/accept-invitation?token=${inviteToken}`;

    const mailOptions = {
      from: `"CloudEvy" <${process.env.GMAIL_USER}>`,
      to,
      subject: `You're invited to join ${workspaceName} on CloudEvy`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">
                        ☁️ CloudEvy
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #f1f5f9; font-size: 24px;">
                        You're invited! 🎉
                      </h2>
                      
                      <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                        <strong style="color: #f1f5f9;">${inviterName}</strong> has invited you to join the workspace 
                        <strong style="color: #3b82f6;">${workspaceName}</strong> on CloudEvy.
                      </p>
                      
                      <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                        You'll be joining as a <strong style="color: #3b82f6; text-transform: capitalize;">${role}</strong>.
                      </p>
                      
                      <p style="margin: 0 0 32px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                        CloudEvy helps teams monitor and manage their cloud infrastructure with real-time metrics, 
                        scheduled automation, and powerful team collaboration features.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${inviteLink}" 
                               style="display: inline-block; padding: 16px 32px; background-color: #3b82f6; color: white; 
                                      text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Accept Invitation →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 32px 0 0 0; padding-top: 32px; border-top: 1px solid #334155; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>
                      </p>
                      
                      <p style="margin: 16px 0 0 0; color: #64748b; font-size: 12px;">
                        This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0f172a; padding: 24px; text-align: center; border-top: 1px solid #334155;">
                      <p style="margin: 0; color: #64748b; font-size: 12px;">
                        © ${new Date().getFullYear()} CloudEvy. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
You're invited to join ${workspaceName} on CloudEvy!

${inviterName} has invited you to join as a ${role}.

Accept your invitation by clicking this link:
${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} CloudEvy
      `.trim()
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Invitation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send invitation email:', error);
      throw error;
    }
  }

  /**
   * Test email connection
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();


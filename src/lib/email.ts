import nodemailer from "nodemailer";

// Configure your email provider here
// For production, use services like SendGrid, Mailgun, Amazon SES, etc.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || "HeyHey <noreply@heyhey.com>",
    to: email,
    subject: "Recuperar contraseña - HeyHey",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #ba5cc6, #9b4dca); border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 15px 30px; background: #ba5cc6; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HeyHey</h1>
            </div>
            <div class="content">
              <h2>Recuperar Contraseña</h2>
              <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </p>
              <p>Este enlace expirará en 1 hora.</p>
              <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HeyHey. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || "HeyHey <noreply@heyhey.com>",
    to: email,
    subject: "Bienvenido a HeyHey",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #ba5cc6, #9b4dca); border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HeyHey</h1>
            </div>
            <div class="content">
              <h2>¡Bienvenido, ${name}!</h2>
              <p>Gracias por registrarte en HeyHey.</p>
              <p>Ahora puedes conectar tu WhatsApp Business API y empezar a gestionar tus conversaciones.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HeyHey. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

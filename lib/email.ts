import nodemailer from "nodemailer";

const NOTIFICATION_EMAILS = [
  "parichay@praxisadvertising.com",
  "aashray@praxisadvertising.com",
];

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendNoteNotification(
  taskName: string,
  noteContent: string,
  author: string
) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `[Email skipped - SMTP not configured] New note on "${taskName}" by ${author}: ${noteContent}`
    );
    return;
  }

  const subject = `New note added to: ${taskName}`;
  const text = `A new note was added to the ISP Tracker.\n\nWall/Space: ${taskName}\nAdded by: ${author}\n\nNote:\n${noteContent}\n\nView the tracker at https://isp.praxisadvertising.com`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e293b; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 18px;">New Note on ISP Tracker</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 12px; color: #475569;"><strong>Wall / Space:</strong> ${taskName}</p>
        <p style="margin: 0 0 16px; color: #475569;"><strong>Added by:</strong> ${author}</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #1e293b; line-height: 1.6;">${noteContent}</p>
        </div>
        <a href="https://isp.praxisadvertising.com" style="display: inline-block; background: #1e293b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">View Tracker</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: NOTIFICATION_EMAILS.join(", "),
    subject,
    text,
    html,
  });
}

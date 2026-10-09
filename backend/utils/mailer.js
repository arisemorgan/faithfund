import formData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";

dotenv.config();

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

/* ======================================================
   SEND EMAIL (HTML Supported)
====================================================== */
export default async function sendEmail(to, subject, html) {
  try {
    const domain = process.env.MAILGUN_DOMAIN;

    if (!domain) {
      console.warn("MAILGUN_DOMAIN is missing in .env");
      return;
    }

    await mg.messages.create(domain, {
      from: process.env.APP_EMAIL || "App <no-reply@example.com>",
      to,
      subject,
      html,
    });

    console.log("Email sent: ", subject);
  } catch (err) {
    console.error("Email sending failed:", err);
  }
}

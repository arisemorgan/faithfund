import formData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_REGION === "eu"
    ? "https://api.eu.mailgun.net"
    : "https://api.mailgun.net",
});

export const sendEmail = async (to, subject, html) => {
  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `${process.env.APP_NAME} <no-reply@${process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
      html,
    });
    console.log("📧 Email sent:", subject);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
};

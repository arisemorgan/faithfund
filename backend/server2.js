// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import sendEmail from "./utils/mailer.js";
import { UAParser } from "ua-parser-js";
import { initDB } from "./db.js";

// Route modules
import churchChannelRoutes from "./routes/churchChannels.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";
import campaignRoutes from "./routes/campaigns.js";
import campaignPageDetailRoutes from "./routes/campaignPageDetail.js";
import settingsRoutes from "./routes/settings.js";
import donationsRoutes from "./routes/donations.js";
import withdrawalRoutes from "./routes/withdrawals.js";

//Profile settings
import userProfileRoutes from "./routes/userProfile.js";
import kycRoutes from "./routes/kyc.js";
import { ensureFolder } from "./middleware/uploads.js";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 📁 Uploads Configuration
// ==============================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

// ==============================
// 🚀 Main Startup Function
// ==============================
const startServer = async () => {
  const db = await initDB();
  const PORT = process.env.PORT || 5000;

  // ==============================
  // 🖼️ File Upload Route
  // ==============================
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // ==============================
  // 👤 Authentication
  // ==============================

  // Register User
  app.post("/api/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    const existing = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomBytes(32).toString("hex");

    await db.run(
      `INSERT INTO users (full_name, email, password_hash, verified, verification_token, role)
       VALUES (?, ?, ?, 0, ?, 'user')`,
      [full_name, email, password_hash, verification_token]
    );

      // Send verification link
      const verifyUrl = `http://localhost:3000/verify-email/${verification_token}`;

      await sendEmail(
        email,
        "Verify your FaithFund Account",
        `<h2>Verify Your Email</h2>
        <p>Hello ${full_name},</p>
        <p>Please click the link below to verify your account:</p>
        <a href="${verifyUrl}">Verify Email</a>`
      );

      res.status(201).json({ message: "Verification email sent!" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Registration failed" });
    }
  });

    //verification token email
    app.get("/api/verify/:token", async (req, res) => {
    const { token } = req.params;

    const user = await db.get("SELECT * FROM users WHERE verification_token = ?", [token]);

    if (!user) return res.status(400).json({ error: "Invalid token" });

    await db.run(
      `UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?`,
      [user.id]
    );

    res.json({ message: "Email verified successfully!" });
   
  });
  //Forgeotten Password
    app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.json({ message: "If email exists, a reset link was sent." });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 1000 * 60 * 30; // 30min

    await db.run(
      `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`,
      [token, expiry, user.id]
    );

    const resetUrl = `http://localhost:3000/reset-password/${token}`;

    await sendEmail(
      email,
      "Reset your password",
      `<h2>Password Reset</h2>
      <p>Click below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>`
    );

    res.json({ message: "Password reset email sent" });
  });

  // Rest Password
  app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await db.get(
    `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?`,
    [token, Date.now()]
  );

  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  const hash = await bcrypt.hash(password, 10);

  await db.run(
    `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`,
    [hash, user.id]
  );

  res.json({ message: "Password reset successful!" });
});



  app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  // ===========================
  // Login Alert Email
  // ===========================
  const parser = new UAParser();
  const result = parser.getResult();
  const ua = result(req.headers["user-agent"]);
  const device = `${ua.device.vendor || "Unknown"} ${ua.device.model || ""}`;
  const browser = ua.browser.name;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  await sendEmail(
    user.email,
    "New Login Detected",
    `
      <h2>Login Alert</h2>
      <p>Your account was logged into.</p>
      <p><b>IP:</b> ${ip}</p>
      <p><b>Browser:</b> ${browser}</p>
      <p><b>Device:</b> ${device}</p>
      <p>If this was not you, reset your password immediately.</p>
    `
  );

  const token = jwt.sign(
    { id: user.id, role: user.role },
    SECRET_KEY,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      verified: user.verified,
    },
  });
});

  // ==============================
  // 📦 API Routes
  // ==============================
  app.use("/api", churchChannelRoutes);
  app.use("/api/user", dashboardRoutes);
  app.use("/api", campaignRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", campaignPageDetailRoutes);
  app.use("/api", settingsRoutes);
  app.use("/api", donationsRoutes);
  app.use("/api", withdrawalRoutes);


  // ==============================
  // 👥 Fetch All Users (Admin)
  // ==============================
  app.get("/api/users", async (req, res) => {
    try {
      const users = await db.all("SELECT * FROM users ORDER BY created_at DESC");
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // ==============================
  // ⚙️ Server Listener
  // ==============================
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🖼️ Uploads available at http://localhost:${PORT}/uploads`);
  });
};

// ==============================
// 🏁 Start Server
// ==============================
startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

// routes/settings.js
import express from "express";
import { initDB } from "../db.js";

const router = express.Router();

/* ============================================
   🟢 GET CRYPTO SETTINGS
============================================ */
router.get("/settings", async (req, res) => {
  try {
    const db = await initDB();
    const settings = await db.get("SELECT * FROM settings LIMIT 1");
    res.json(settings || {});
  } catch (error) {
    console.error("❌ Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/* ============================================
   🟣 UPDATE CRYPTO SETTINGS (Admin Only)
============================================ */
router.post("/settings", async (req, res) => {
  const { btc_address, btc_qr, usdt_address, usdt_qr } = req.body;

  try {
    const db = await initDB();
    await db.run(
      `INSERT OR REPLACE INTO settings (id, btc_address, btc_qr, usdt_address, usdt_qr)
       VALUES (1, ?, ?, ?, ?)`,
      [btc_address, btc_qr, usdt_address, usdt_qr]
    );

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;

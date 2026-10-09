import express from "express";
import { initDB } from "../db.js";

const router = express.Router();

/* -------------------------------------------
   GET CAMPAIGN BY ID
-------------------------------------------- */
router.get("/campaigns/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = await initDB();
    const campaign = await db.get("SELECT * FROM campaigns WHERE id = ?", [id]);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

/* -------------------------------------------
   GET CAMPAIGN BY SLUG
-------------------------------------------- */
router.get("/campaigns/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const db = await initDB();
    const campaign = await db.get("SELECT * FROM campaigns WHERE slug = ?", [slug]);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

/* -------------------------------------------
   POST DONATION (Auto-credit wallet & transaction_ref)
-------------------------------------------- */
router.post("/donations", async (req, res) => {
  const { campaign_id, donor_name, donor_email, amount, donor_user_id } = req.body;

  if (!campaign_id || !donor_name || !donor_email || !amount) {
    return res.status(400).json({ error: "Missing donation data" });
  }

  try {
    const db = await initDB();

    // Transaction reference
    const transaction_ref = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Record donation
    await db.run(
      `INSERT INTO donations (campaign_id, user_id, donor_name, donor_email, amount, transaction_ref, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', datetime('now'))`,
      [campaign_id, donor_user_id || null, donor_name, donor_email, amount, transaction_ref]
    );

    // Update campaign raised amount
    await db.run(
      `UPDATE campaigns SET amount_raised = amount_raised + ? WHERE id = ?`,
      [amount, campaign_id]
    );

    // Auto-credit campaign owner wallet
    const campaign = await db.get(`SELECT user_id FROM campaigns WHERE id = ?`, [campaign_id]);
    if (campaign?.user_id) {
      await db.run(
        `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
        [amount, campaign.user_id]
      );

      await db.run(
        `INSERT INTO wallet_transactions (user_id, type, amount, description, created_at)
         VALUES (?, 'credit', ?, 'Donation received', datetime('now'))`,
        [campaign.user_id, amount]
      );
    }

    res.status(200).json({ message: "Donation successful!", transaction_ref });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process donation" });
  }
});

export default router;

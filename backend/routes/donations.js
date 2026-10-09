import express from "express";
import { initDB } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ==============================
   🧾 FETCH DONATIONS BY LOGGED-IN USER
============================== */
router.get("/user/donations", verifyToken, async (req, res) => {
  try {
    const db = await initDB();
    const userId = req.user.id; // ✅ from JWT middleware

    const donations = await db.all(
      `SELECT 
        d.id,
        d.amount,
        d.status,
        d.created_at AS date,
        c.id AS campaign_id,
        c.title AS campaign_title
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      WHERE d.user_id = ?
      ORDER BY datetime(d.created_at) DESC`,
      [userId]
    );

    const formatted = donations.map((d) => ({
      ...d,
      date: d.date ? d.date.replace(" ", "T") : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching user donations:", err);
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

/* ==============================
   📊 FETCH USER DASHBOARD STATS
============================== */
router.get("/user/dashboard", verifyToken, async (req, res) => {
  try {
    const db = await initDB();
    const userId = req.user.id;

    // Fetch user's campaigns and donations
    const [campaigns, donations] = await Promise.all([
      db.all("SELECT * FROM campaigns WHERE user_id = ?", [userId]),
      db.all("SELECT * FROM donations WHERE user_id = ?", [userId]),
    ]);

    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
    const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDonors = new Set(donations.map((d) => d.donor_email)).size;
    const avgDonation = donations.length ? totalRaised / donations.length : 0;

    // Get 3 most recent donations
    const recentDonations = donations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    // Campaign performance chart data
    const campaignPerformance = campaigns.map((c) => ({
      name: c.title,
      progress: Math.min(Math.round((c.amount_raised / c.goal) * 100), 100),
    }));

    res.json({
      stats: { activeCampaigns, totalRaised, totalDonors, avgDonation },
      recentDonations,
      campaignPerformance,
    });
  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    res.status(500).json({ error: "Error loading dashboard data" });
  }
});

router.post("/donate/wallet", verifyToken, async (req, res) => {
  const { campaign_id, amount } = req.body;
  const userId = req.user.id;

  try {
    const db = await initDB();

    // Deduct from wallet
    await debitWallet(userId, amount, "Donation to campaign");

    // Insert donation record
    await db.run(
      `INSERT INTO donations (user_id, campaign_id, amount, status, transaction_ref)
       VALUES (?, ?, ?, "completed", ?)`,
      [userId, campaign_id, amount, `WALLET-${Date.now()}`]
    );

    res.json({ message: "Donation successful from wallet" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


export default router;

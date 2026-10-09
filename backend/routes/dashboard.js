import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

async function openDb() {
  return open({
    filename: "./faithfund.db",
    driver: sqlite3.Database,
  });
}

router.get("/dashboard", verifyToken, async (req, res) => {
  const db = await openDb();
  const userId = req.user.id; // coming from the decoded JWT token

  try {
    // Fetch user-specific data
    const [campaigns, donations] = await Promise.all([
      db.all("SELECT * FROM campaigns WHERE user_id = ?", [userId]),
      db.all("SELECT * FROM donations WHERE user_id = ?", [userId]),
    ]);

    const activeCampaigns = campaigns.filter(c => c.status === "approved").length;
    const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDonors = new Set(donations.map(d => d.donor_email)).size;
    const avgDonation = donations.length ? totalRaised / donations.length : 0;

    // Get 3 most recent donations
    const recentDonations = donations
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    // Campaign performance
    const campaignPerformance = campaigns.map(c => ({
      name: c.title,
      progress: Math.min(Math.round((c.amount_raised / c.goal) * 100), 100),
    }));

    res.json({
      stats: {
        activeCampaigns,
        totalRaised,
        totalDonors,
        avgDonation,
      },
      recentDonations,
      campaignPerformance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error loading dashboard data" });
  }
});

export default router;

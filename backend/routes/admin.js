// routes/admin.js
import express from "express";
import { initDB } from "../db.js";

const router = express.Router();

// ===== ADMIN DASHBOARD STATS =====
router.get("/stats", async (req, res) => {
  const db = await initDB();
  try {
    const totalUsers = await db.get("SELECT COUNT(*) AS count FROM users");
    const totalCampaigns = await db.get("SELECT COUNT(*) AS count FROM campaigns");
    const totalRaised = await db.get("SELECT SUM(amount_raised) AS total FROM campaigns");
    const pending = await db.get("SELECT COUNT(*) AS count FROM campaigns WHERE status = 'pending'");
    const totalWithdrawals = await db.get("SELECT COUNT(*) AS count FROM withdrawals");
    const totalDonations = await db.get("SELECT COUNT(*) AS count FROM donations");

    res.json({
      users: totalUsers.count,
      campaigns: totalCampaigns.count,
      raised: totalRaised.total || 0,
      pending: pending.count,
      withdrawals: totalWithdrawals.count,
      donations: totalDonations.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// ===== USERS MANAGEMENT (Admin Only) =====
router.get("/users", async (req, res) => {
  try {
    const db = await initDB();
    const { search = "", sort = "latest", limit = 50 } = req.query;

    let query = `
      SELECT id, full_name, email, role, verified, status, created_at
      FROM users
      WHERE full_name LIKE ? OR email LIKE ? OR role LIKE ?
      ORDER BY created_at ${sort === "latest" ? "DESC" : "ASC"}
      LIMIT ?
    `;

    const users = await db.all(query, [`%${search}%`, `%${search}%`, `%${search}%`, limit]);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// ✅ Update role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const db = await initDB();

    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ error: "User not found" });

    await db.run("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: "✅ Role updated successfully" });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ error: "Error updating role" });
  }
});

// ✅ Verify / Unverify user
router.put("/users/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    const db = await initDB();

    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newStatus = verified ? "Active" : "Pending";
    await db.run("UPDATE users SET verified = ?, status = ? WHERE id = ?", [verified, newStatus, id]);

    res.json({ message: verified ? "✅ User verified" : "❌ User unverified" });
  } catch (err) {
    console.error("Error updating verification:", err);
    res.status(500).json({ error: "Error updating verification" });
  }
});

// ✅ Suspend / Reactivate user
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await initDB();

    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ error: "User not found" });

    await db.run("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: `✅ User ${status === "Suspended" ? "suspended" : "reactivated"}` });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Error updating status" });
  }
});

// ===== CAMPAIGNS =====
router.get("/pending-campaigns", async (req, res) => {
  try {
    const db = await initDB();
    const rows = await db.all(`
      SELECT c.*, u.full_name AS creator_name
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching pending campaigns:", err);
    res.status(500).json({ error: "Error fetching pending campaigns" });
  }
});

router.put("/campaigns/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await initDB();
    await db.run("UPDATE campaigns SET status = 'active' WHERE id = ?", [id]);
    res.json({ message: "✅ Campaign approved" });
  } catch (err) {
    console.error("Error approving campaign:", err);
    res.status(500).json({ error: "Error approving campaign" });
  }
});

router.put("/campaigns/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await initDB();
    await db.run("UPDATE campaigns SET status = 'rejected' WHERE id = ?", [id]);
    res.json({ message: "❌ Campaign rejected" });
  } catch (err) {
    console.error("Error rejecting campaign:", err);
    res.status(500).json({ error: "Error rejecting campaign" });
  }
});

router.put("/archive-expired", async (req, res) => {
  try {
    const db = await initDB();
    await db.run("UPDATE campaigns SET status = 'archived' WHERE status = 'expired'");
    res.json({ message: "📦 Expired campaigns archived successfully" });
  } catch (err) {
    console.error("Error archiving campaigns:", err);
    res.status(500).json({ error: "Error archiving campaigns" });
  }
});


// ✅ FEATURED CAMPAIGNS ENDPOINT (for frontend /api/campaigns/featured)
router.get("/campaigns/featured", async (req, res) => {
  try {
    const db = await initDB();
    const rows = await db.all(`
      SELECT 
        c.id,
        c.title,
        c.slug,
        c.description,
        c.image_url AS imageUrl,
        c.goal_amount AS goalAmount,
        c.amount_raised AS raisedAmount,
        c.category,
        c.status,
        u.full_name AS creatorName
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT 6
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching featured campaigns:", err);
    res.status(500).json({ error: "Error fetching featured campaigns" });
  }
});


// ===== WITHDRAWALS =====
router.get("/withdrawals", async (req, res) => {
  try {
    const db = await initDB();
    const rows = await db.all(`
      SELECT w.*, u.full_name AS user_name, c.title AS campaign_name
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      LEFT JOIN campaigns c ON w.campaign_id = c.id
      ORDER BY w.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching withdrawals:", err);
    res.status(500).json({ error: "Error fetching withdrawals" });
  }
});

router.put("/withdrawals/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await initDB();
    await db.run("UPDATE withdrawals SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: `✅ Withdrawal ${status}` });
  } catch (err) {
    console.error("Error updating withdrawal:", err);
    res.status(500).json({ error: "Error updating withdrawal" });
  }
});

// ==================== ADMIN DASHBOARD STATS (DUPLICATE FIXED) ====================
router.get("/stats-summary", async (req, res) => {
  try {
    const db = await initDB();
    const stats = await db.get(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM campaigns) AS campaigns,
        (SELECT SUM(amount) FROM donations) AS raised,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'pending') AS pending
    `);
    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

  // 🧾 Fetch all donations with campaign + donor info
  router.get("/donations", async (req, res) => {
    try {
      const db = await initDB();

      const donations = await db.all(`
        SELECT 
          donations.id,
          donations.donor_name,
          donations.donor_email,
          donations.amount,
          donations.status,
          donations.transaction_ref,
          donations.created_at,
          campaigns.title AS campaign_name,
          users.full_name AS user_name
        FROM donations
        LEFT JOIN campaigns ON donations.campaign_id = campaigns.id
        LEFT JOIN users ON donations.user_id = users.id
        ORDER BY donations.created_at DESC
      `);

      res.json(donations);
    } catch (error) {
      console.error("❌ Error fetching donations:", error);
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  // 🛠️ Update donation status
  router.put("/donations/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const db = await initDB();
      await db.run(`UPDATE donations SET status = ? WHERE id = ?`, [status, id]);
      res.json({ message: "Donation status updated successfully" });
    } catch (error) {
      console.error("❌ Error updating donation status:", error);
      res.status(500).json({ error: "Failed to update donation status" });
    }
  });

// ==================== DONATION TRENDS ====================
router.get("/donation_trends", async (req, res) => {
  try {
    const { year, startDate, endDate } = req.query;
    let query = `
      SELECT 
        strftime('%Y-%m', created_at) AS month,
        SUM(amount) AS amount
      FROM donations
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      query += " AND strftime('%Y', created_at) = ?";
      params.push(year);
    }
    if (startDate && endDate) {
      query += " AND date(created_at) BETWEEN date(?) AND date(?)";
      params.push(startDate, endDate);
    }

    query += " GROUP BY month ORDER BY month ASC";

    const db = await initDB();
    const rows = await db.all(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching donation trends:", err);
    res.status(500).json({ error: "Failed to fetch donation trends" });
  }
});

// ==================== CAMPAIGN CATEGORIES STATS ====================
router.get("/campaign_categories", async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT category, COUNT(*) AS count
      FROM campaigns
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    query += " GROUP BY category ORDER BY count DESC";

    const db = await initDB();
    const rows = await db.all(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching campaign categories:", err);
    res.status(500).json({ error: "Failed to fetch campaign categories" });
  }
});

// ===== CHURCH CHANNELS =====
router.get("/church_channels", async (req, res) => {
  try {
    const db = await initDB();
    const rows = await db.all("SELECT * FROM church_channels ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching church channels:", err);
    res.status(500).json({ error: "Error fetching church channels" });
  }
});

router.post("/church_channels", async (req, res) => {
  try {
    const { name, youtube_url, description, status } = req.body;
    const db = await initDB();
    await db.run(
      "INSERT INTO church_channels (name, youtube_url, description, status) VALUES (?, ?, ?, ?)",
      [name, youtube_url, description, status || "active"]
    );
    res.json({ message: "✅ Church channel added successfully" });
  } catch (err) {
    console.error("Error adding church channel:", err);
    res.status(500).json({ error: "Error adding church channel" });
  }
});

router.put("/church_channels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { youtube_url, description, status } = req.body;
    const db = await initDB();
    await db.run(
      "UPDATE church_channels SET youtube_url = ?, description = ?, status = ? WHERE id = ?",
      [youtube_url, description, status, id]
    );
    res.json({ message: "✅ Church channel updated successfully" });
  } catch (err) {
    console.error("Error updating church channel:", err);
    res.status(500).json({ error: "Error updating church channel" });
  }
});

router.delete("/church_channels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await initDB();
    await db.run("DELETE FROM church_channels WHERE id = ?", [id]);
    res.json({ message: "🗑️ Channel deleted successfully" });
  } catch (err) {
    console.error("Error deleting church channel:", err);
    res.status(500).json({ error: "Error deleting church channel" });
  }
});

export default router;

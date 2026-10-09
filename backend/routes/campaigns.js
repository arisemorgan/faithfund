// routes/campaigns.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { initDB } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ==============================
   IMAGE UPLOAD CONFIGURATION
============================== */
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

/* ==============================
   IMAGE UPLOAD ENDPOINT
============================== */
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

/* ==============================
   CREATE A NEW CAMPAIGN
============================== */
router.post("/campaigns", async (req, res) => {
  try {
    const db = await initDB();

    const {
      title,
      description,
      category,
      goalAmount,
      images,
      videoUrl,
      slug,
      userId,
    } = req.body;

    // ---------- VALIDATION ----------
    if (!title) return res.status(400).json({ error: "Title is required" });
    if (!description) return res.status(400).json({ error: "Description is required" });
    if (!category) return res.status(400).json({ error: "Category is required" });
    if (!goalAmount) return res.status(400).json({ error: "Goal amount is required" });
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Use the first image as primary
    const imageUrl = images[0];
    const imagesJson = JSON.stringify(images);

    // ---------- INSERT INTO DB ----------
    await db.run(
      `INSERT INTO campaigns 
        (title, description, category, goal_amount, image_url, images_json, video_url, slug, user_id, status, amount_raised, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, datetime('now'))`,
      [
        title,
        description,
        category,
        goalAmount,
        imageUrl,
        imagesJson,        // all images saved as JSON
        videoUrl || null,
        slug,
        userId,
      ]
    );

    res.json({
      message: "🎉 Campaign created successfully and is pending admin approval",
    });
  } catch (err) {
    console.error("Error creating campaign:", err);
    res.status(500).json({ error: "Server error while creating campaign" });
  }
});


/* ==============================
   FETCH ALL CAMPAIGNS
   (Admin can see all statuses)
============================== */
router.get("/campaigns", async (req, res) => {
  try {
    const { category } = req.query;
    const db = await initDB();

    let query = `
      SELECT 
        c.id,
        c.title,
        c.slug,
        c.description,
        c.image_url AS imageUrl,
        c.images_json AS imagesJson,
        c.goal_amount AS goalAmount,
        c.amount_raised AS raisedAmount,
        c.category,
        c.status,
        c.created_at,
        c.user_id AS userId,
        u.full_name AS creatorName
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status != 'deleted'
    `;

    const params = [];
    if (category && category !== "all") {
      query += " AND c.category = ?";
      params.push(category);
    }

    query += " ORDER BY datetime(c.created_at) DESC";
    const rows = await db.all(query, params);

    // Fix created_at format (SQLite → valid ISO string)
    const formattedRows = rows.map(c => ({
      ...c,
      created_at: c.created_at ? c.created_at.replace(" ", "T") : null,
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

/* ==============================
   ADMIN ACTIONS
============================== */

// ✅ Approve Campaign
router.patch("/campaigns/:id/approve", async (req, res) => {
  try {
    const db = await initDB();
    await db.run("UPDATE campaigns SET status = 'approved' WHERE id = ?", [req.params.id]);
    res.json({ message: "✅ Campaign approved successfully" });
  } catch (err) {
    console.error("Error approving campaign:", err);
    res.status(500).json({ error: "Failed to approve campaign" });
  }
});

// ✅ Archive Campaign
router.patch("/campaigns/:id/archive", async (req, res) => {
  try {
    const db = await initDB();
    await db.run("UPDATE campaigns SET status = 'archived' WHERE id = ?", [req.params.id]);
    res.json({ message: "📦 Campaign archived successfully" });
  } catch (err) {
    console.error("Error archiving campaign:", err);
    res.status(500).json({ error: "Failed to archive campaign" });
  }
});

// ✅ Soft Delete Campaign (kept in DB but hidden)
router.patch("/campaigns/:id/delete", async (req, res) => {
  try {
    const db = await initDB();
    await db.run("UPDATE campaigns SET status = 'deleted' WHERE id = ?", [req.params.id]);
    res.json({ message: "🗑️ Campaign deleted successfully (soft delete)" });
  } catch (err) {
    console.error("Error deleting campaign:", err);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

// ✅ Generic Status Update (for reuse)
router.patch("/campaigns/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await initDB();
    await db.run("UPDATE campaigns SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: `✅ Campaign ${id} updated to '${status}'` });
  } catch (err) {
    console.error("Error updating campaign status:", err);
    res.status(500).json({ error: "Failed to update campaign status" });
  }
});

  // Toggle featured
router.patch("/campaigns/:id/feature", async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    const db = await initDB();

    await db.run("UPDATE campaigns SET featured = ? WHERE id = ?", [
      featured,
      id,
    ]);

    res.json({ message: "Featured updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update featured" });
  }
});

  // ==============================
// UPDATE CAMPAIGN (Admin)
// ==============================
router.patch("/campaigns/:id/edit", async (req, res) => {
  try {
    const db = await initDB();
    const { title, description, category, goalAmount, videoUrl, images } = req.body;

    const imagesJson = images ? JSON.stringify(images) : null;

    await db.run(
      `UPDATE campaigns SET 
         title = ?, 
         description = ?, 
         category = ?, 
         goal_amount = ?, 
         video_url = ?, 
         images_json = ?
       WHERE id = ?`,
      [title, description, category, goalAmount, videoUrl, imagesJson, req.params.id]
    );

    res.json({ message: "Campaign updated successfully" });
  } catch (err) {
    console.error("Error updating campaign:", err);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});
  // ==============================
// DELETE SINGLE IMAGE
// ==============================
router.delete("/campaigns/:id/image", async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: "Image URL missing" });

    const db = await initDB();
    const campaign = await db.get("SELECT images_json FROM campaigns WHERE id = ?", [id]);

    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    // Parse stored images
    let images = [];
    try {
      images = campaign.images_json ? JSON.parse(campaign.images_json) : [];
      if (!Array.isArray(images)) images = [images]; // ensure it's array
    } catch (err) {
      console.error("❌ JSON parse failed images_json:", err);
      return res.status(500).json({ error: "Invalid images_json stored in database" });
    }

    // Remove selected image
    const updatedImages = images.filter(img => img !== url);

    await db.run(
      "UPDATE campaigns SET images_json = ? WHERE id = ?",
      [JSON.stringify(updatedImages), id]
    );

    return res.json({ success: true, images: updatedImages });

  } catch (err) {
    console.error("🔥 SERVER DELETE ERROR:", err);
    return res.status(500).json({ error: "Image delete failed" });
  }
});

  // ==============================
// SIMPLE PATCH UPDATE (used by admin panel editor)
// ==============================
router.patch("/campaigns/:id", async (req, res) => {
  try {
    const db = await initDB();
    const { title, description, videoUrl } = req.body;

    await db.run(
      `UPDATE campaigns SET title=?, description=?, video_url=? WHERE id=?`,
      [title, description, videoUrl, req.params.id]
    );

    res.json({ success: true, message: "Campaign updated" });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});


/* ==============================
   FETCH FEATURED (APPROVED) CAMPAIGNS
============================== */
router.get("/campaigns/featured", async (req, res) => {
  try {
    const db = await initDB();

    const query = `
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
        c.created_at,
        u.full_name AS creatorName
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'approved'
      ORDER BY datetime(c.created_at) DESC
      LIMIT 6
    `;

    const rows = await db.all(query);

    const formattedRows = rows.map((c) => ({
      ...c,
      created_at: c.created_at ? c.created_at.replace(" ", "T") : null,
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error("Error fetching featured campaigns:", err);
    res.status(500).json({ error: "Failed to fetch featured campaigns" });
  }
});

/* ==============================
   FETCH SINGLE CAMPAIGN BY SLUG
============================== */
router.get("/campaigns/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const db = await initDB();

    const campaign = await db.get(
      `SELECT 
        c.id,
        c.title,
        c.slug,
        c.description,
        c.image_url AS imageUrl,
        c.images_json AS imagesJson,
        c.video_url AS videoUrl,
        c.goal_amount AS goalAmount,
        c.amount_raised AS raisedAmount,
        c.category,
        c.status,
        c.created_at,
        u.full_name AS creatorName
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.slug = ? AND c.status != 'deleted'
      LIMIT 1`,
      [slug]
    );

    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    campaign.created_at = campaign.created_at?.replace(" ", "T") ?? null;
    res.json(campaign);
  } catch (err) {
    console.error("Error fetching campaign by slug:", err);
    res.status(500).json({ error: "Failed to fetch campaign by slug" });
  }
});


/* ==============================
   FETCH SINGLE CAMPAIGN BY ID
============================== */
router.get("/campaigns/:id", async (req, res) => {
  try {
    const db = await initDB();

    const campaign = await db.get(
      `SELECT 
        c.id,
        c.title,
        c.slug,
        c.description,
        c.image_url AS imageUrl,
        c.images_json AS imagesJson,
        c.video_url AS videoUrl,
        c.goal_amount AS goalAmount,
        c.amount_raised AS raisedAmount,
        c.category,
        c.status,
        c.created_at,
        u.full_name AS creatorName
      FROM campaigns c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ? AND c.status != 'deleted'
      LIMIT 1`,
      [req.params.id]
    );

    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    campaign.created_at = campaign.created_at?.replace(" ", "T") ?? null;
    res.json(campaign);
  } catch (err) {
    console.error("Error fetching campaign by ID:", err);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});



/* ==============================
   FETCH CAMPAIGNS BY USER ID
============================== */
router.get("/user/campaigns/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await initDB();

    const rows = await db.all(
      `SELECT 
        c.id,
        c.title,
        c.slug,
        c.description,
        c.image_url AS imageUrl,
        c.goal_amount AS goalAmount,
        c.amount_raised AS raisedAmount,
        c.category,
        c.status,
        c.created_at
      FROM campaigns c
      WHERE c.user_id = ? AND c.status != 'deleted'
      ORDER BY datetime(c.created_at) DESC`,
      [userId]
    );

    const formattedRows = rows.map(c => ({
      ...c,
      created_at: c.created_at ? c.created_at.replace(" ", "T") : null,
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error("Error fetching user campaigns:", err);
    res.status(500).json({ error: "Failed to fetch user campaigns" });
  }
});




/* ==============================
   FETCH CAMPAIGNS BY LOGGED-IN USER
============================== */
router.get("/user/campaigns", verifyToken, async (req, res) => {
  try {
    const db = await initDB();
    const userId = req.user.id; // ✅ from JWT

    const campaigns = await db.all(
      `SELECT 
        id, title, slug, description,
        image_url AS imageUrl,
        goal_amount AS goalAmount,
        amount_raised AS raisedAmount,
        category, status, created_at
       FROM campaigns
       WHERE user_id = ? AND status != 'deleted'
       ORDER BY datetime(created_at) DESC`,
      [userId]
    );

    const formatted = campaigns.map(c => ({
      ...c,
      created_at: c.created_at ? c.created_at.replace(" ", "T") : null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching user campaigns:", err);
    res.status(500).json({ error: "Failed to fetch user campaigns" });
  }
});




export default router; 
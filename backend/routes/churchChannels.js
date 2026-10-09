// routes/churchChannels.js
import express from "express";
import { initDB } from "../db.js";

const router = express.Router();

// ===== Get all church channels =====
router.get("/church_channels", async (req, res) => {
  try {
    const db = await initDB();
    const channels = await db.all("SELECT * FROM church_channels ORDER BY created_at DESC");
    res.json(channels);
  } catch (err) {
    console.error("Error fetching church channels:", err);
    res.status(500).json({ error: "Failed to fetch church channels" });
  }
});

// ===== Add new church channel =====
router.post("/church_channels", async (req, res) => {
  try {
    const { name, youtube_url, description, status } = req.body;
    if (!name) return res.status(400).json({ error: "Channel name required" });

    const db = await initDB();
    await db.run(
      `INSERT INTO church_channels (name, youtube_url, description, status)
       VALUES (?, ?, ?, ?)`,
      [name, youtube_url || "", description || "", status || "active"]
    );

    res.status(201).json({ message: "✅ Channel added successfully" });
  } catch (err) {
    console.error("Error adding channel:", err);
    res.status(500).json({ error: "Error adding church channel" });
  }
});

// ===== Update existing church channel =====
router.put("/church_channels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { youtube_url, name, description, status } = req.body;
    const db = await initDB();

    await db.run(
      `UPDATE church_channels 
       SET youtube_url = COALESCE(?, youtube_url),
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [youtube_url, name, description, status, id]
    );

    res.json({ message: "✅ Channel updated successfully" });
  } catch (err) {
    console.error("Error updating channel:", err);
    res.status(500).json({ error: "Failed to update church channel" });
  }
});

// ===== Delete church channel =====
router.delete("/church_channels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await initDB();
    await db.run("DELETE FROM church_channels WHERE id = ?", [id]);
    res.json({ message: "🗑️ Channel deleted successfully" });
  } catch (err) {
    console.error("Error deleting channel:", err);
    res.status(500).json({ error: "Failed to delete channel" });
  }
});

export default router;

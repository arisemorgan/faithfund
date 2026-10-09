import express from "express";
import { upload } from "../middleware/uploads.js";
import { initDB } from "../db.js";

const router = express.Router();

/**
 * GET /api/user/profile
 * NOTE: verifyToken is now handled in server.js
 */
router.get("/profile", async (req, res) => {
  try {
    const db = await initDB();
    const userId = req.user.id;

    const user = await db.get(
      `SELECT 
          u.id, u.full_name, u.email, u.profile_photo,
          u.bank_name, u.account_name, u.account_number,
          k.bvn, k.nin
       FROM users u
       LEFT JOIN kyc k ON k.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("GET /profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});


/**
 * PUT /api/user/profile
 * NOTE: verifyToken is now handled in server.js
 */
router.put(
  "/profile",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "passport", maxCount: 1 },
    { name: "driver_license", maxCount: 1 },
    { name: "national_id", maxCount: 1 },
    { name: "utility_bill", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const db = await initDB();
      const userId = req.user.id;

      const { bank_name, account_number, account_name, bvn, nin } = req.body;

      // Validation
      if (bvn && bvn.length !== 11) {
        return res.status(400).json({ error: "BVN must be 11 digits" });
      }
      if (nin && nin.length !== 11) {
        return res.status(400).json({ error: "NIN must be 11 digits" });
      }

      // Profile Photo (optional)
      const profile_photo = req.files?.profilePicture
        ? `/uploads/profile/${req.files.profilePicture[0].filename}`
        : null;

      await db.run(
        `UPDATE users SET
          bank_name = ?,
          account_number = ?,
          account_name = ?,
          profile_photo = COALESCE(?, profile_photo)
        WHERE id = ?`,
        [bank_name, account_number, account_name, profile_photo, userId]
      );

      // Handle KYC
      const existing = await db.get(
        "SELECT id FROM kyc WHERE user_id = ?",
        [userId]
      );

      const docs = {
        passport_url: req.files?.passport
          ? `/uploads/kyc/${req.files.passport[0].filename}`
          : null,
        driver_license_url: req.files?.driver_license
          ? `/uploads/kyc/${req.files.driver_license[0].filename}`
          : null,
        national_id_url: req.files?.national_id
          ? `/uploads/kyc/${req.files.national_id[0].filename}`
          : null,
        utility_bill_url: req.files?.utility_bill
          ? `/uploads/kyc/${req.files.utility_bill[0].filename}`
          : null,
      };

      if (existing) {
        await db.run(
          `UPDATE kyc SET
            bvn = ?,
            nin = ?,
            passport_url = COALESCE(?, passport_url),
            driver_license_url = COALESCE(?, driver_license_url),
            national_id_url = COALESCE(?, national_id_url),
            utility_bill_url = COALESCE(?, utility_bill_url),
            status = 'pending',
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?`,
          [
            bvn,
            nin,
            docs.passport_url,
            docs.driver_license_url,
            docs.national_id_url,
            docs.utility_bill_url,
            userId,
          ]
        );
      } else {
        await db.run(
          `INSERT INTO kyc
            (user_id, bvn, nin, passport_url, driver_license_url, national_id_url, utility_bill_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            bvn,
            nin,
            docs.passport_url,
            docs.driver_license_url,
            docs.national_id_url,
            docs.utility_bill_url,
          ]
        );
      }

      res.json({ message: "Profile saved successfully!" });
    } catch (err) {
      console.error("PUT /profile error:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

export default router;

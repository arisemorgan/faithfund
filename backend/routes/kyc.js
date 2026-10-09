import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../middleware/uploads.js";
import { initDB } from "../db.js";
import sendEmail from "../utils/mailer.js";

const router = express.Router();

/* ------------------------------------------------------------------
   USER — Save Profile (Photo, Bank, KYC Docs)
------------------------------------------------------------------ */
router.put(
  "/user/profile",
  verifyToken,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "passport", maxCount: 1 },
    { name: "driver_license", maxCount: 1 },
    { name: "national_id", maxCount: 1 },
    { name: "utility_bill", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const db = await initDB();

      const {
        bank_name,
        account_number,
        account_name,
        bvn,
        nin,
      } = req.body;

      /* FIXED: profile photo folder corrected */
      let profile_photo = null;
      if (req.files.profilePicture) {
        profile_photo = "/uploads/kyc/" + req.files.profilePicture[0].filename;
      }

      await db.run(
        `UPDATE users SET 
          bank_name=?, 
          account_number=?, 
          account_name=?,
          profile_photo=COALESCE(?, profile_photo)
        WHERE id=?`,
        [
          bank_name || null,
          account_number || null,
          account_name || null,
          profile_photo,
          userId,
        ]
      );

      /* Build KYC document paths */
      const docs = {
        passport_url: req.files.passport
          ? "/uploads/kyc/" + req.files.passport[0].filename
          : null,
        driver_license_url: req.files.driver_license
          ? "/uploads/kyc/" + req.files.driver_license[0].filename
          : null,
        national_id_url: req.files.national_id
          ? "/uploads/kyc/" + req.files.national_id[0].filename
          : null,
        utility_bill_url: req.files.utility_bill
          ? "/uploads/kyc/" + req.files.utility_bill[0].filename
          : null,
      };

      const exists = await db.get(`SELECT id FROM kyc WHERE user_id=?`, [
        userId,
      ]);

      if (exists) {
        await db.run(
          `UPDATE kyc SET 
            bvn=?, 
            nin=?, 
            passport_url=COALESCE(?, passport_url),
            driver_license_url=COALESCE(?, driver_license_url),
            national_id_url=COALESCE(?, national_id_url),
            utility_bill_url=COALESCE(?, utility_bill_url),
            updated_at=CURRENT_TIMESTAMP,
            status='pending'
          WHERE user_id=?`,
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
          `INSERT INTO kyc (
            user_id, bvn, nin, passport_url, driver_license_url, national_id_url, utility_bill_url
          )
          VALUES (?,?,?,?,?,?,?)`,
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

      res.json({ message: "Profile & KYC successfully saved!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

/* ------------------------------------------------------------------
   ADMIN — Fetch All KYC Submissions (WITH FIXED COLUMN NAME)
------------------------------------------------------------------ */
router.get("/admin/kyc", verifyToken, async (req, res) => {
  try {
    const db = await initDB();

    const rows = await db.all(`
      SELECT 
        k.*,
        u.email AS user_email,
        u.full_name AS user_full_name,   -- FIXED
        u.profile_photo,
        u.bank_name,
        u.account_number,
        u.account_name
      FROM kyc k
      LEFT JOIN users u ON u.id = k.user_id
      ORDER BY k.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Unable to fetch KYC submissions" });
  }
});

/* ------------------------------------------------------------------
   ADMIN — Update Single Status
------------------------------------------------------------------ */
router.put("/admin/kyc/:id/status", verifyToken, async (req, res) => {
  try {
    const { status, admin_comment } = req.body;
    const { id } = req.params;

    const db = await initDB();
    const kyc = await db.get(`SELECT * FROM kyc WHERE id=?`, [id]);

    if (!kyc) return res.status(404).json({ error: "KYC not found" });

    await db.run(
      `UPDATE kyc SET 
        status=?, 
        admin_comment=?, 
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?`,
      [status, admin_comment, id]
    );

    const user = await db.get(`SELECT email FROM users WHERE id=?`, [
      kyc.user_id,
    ]);

    sendEmail(
      user.email,
      `KYC ${status.toUpperCase()}`,
      `
        <h2>KYC Status Update</h2>
        <p>Your KYC has been <strong>${status.toUpperCase()}</strong>.</p>
        <p>${admin_comment || ""}</p>
      `
    );

    res.json({ message: `KYC ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to update KYC" });
  }
});

/* ------------------------------------------------------------------
   ADMIN — Bulk Approve/Reject
------------------------------------------------------------------ */
router.put("/admin/kyc/bulk-status", verifyToken, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids?.length) {
      return res.status(400).json({ error: "No IDs provided" });
    }

    const db = await initDB();
    const placeholders = ids.map(() => "?").join(",");

    await db.run(
      `UPDATE kyc SET 
        status=?, 
        updated_at=CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})`,
      [status, ...ids]
    );

    res.json({ message: `Bulk update completed (${status})` });
  } catch (err) {
    res.status(500).json({ error: "Bulk operation failed" });
  }
});

/* ------------------------------------------------------------------
   ADMIN — Download CSV Audit Log
------------------------------------------------------------------ */
router.get("/admin/kyc/audit-log", verifyToken, async (req, res) => {
  try {
    const db = await initDB();

    const rows = await db.all(`
      SELECT k.*, u.email 
      FROM kyc k
      LEFT JOIN users u ON u.id = k.user_id
    `);

    let csv = "ID,Email,Status,BVN,NIN,Created,Updated\n";

    rows.forEach((r) => {
      csv += `${r.id},${r.email},${r.status},${r.bvn},${r.nin},${r.created_at},${r.updated_at}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=kyc_audit_log.csv"
    );

    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate CSV" });
  }
});

/* ------------------------------------------------------------------
   USER — Must Be KYC Approved to Withdraw
------------------------------------------------------------------ */
router.post("/withdrawals", verifyToken, async (req, res, next) => {
  const db = await initDB();
  const userId = req.user.id;

  const kyc = await db.get(`SELECT status FROM kyc WHERE user_id=?`, [
    userId,
  ]);

  if (!kyc || kyc.status !== "approved") {
    return res
      .status(403)
      .json({ error: "KYC must be approved before withdrawing." });
  }

  next();
});

export default router;

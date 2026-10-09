import express from "express";
import { initDB } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { debitWallet, creditWallet } from "../utils/wallet.js";
import sendEmail from "../utils/mailer.js";

const router = express.Router();

/* -------------------------------------------
   USER - Request Withdrawal
-------------------------------------------- */
router.post("/withdrawals", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal amount" });
    }

    const db = await initDB();

    // Deduct from wallet first
    await debitWallet(userId, Number(amount), "Withdrawal Request");

    // Create withdrawal record
    await db.run(
      `INSERT INTO withdrawals (user_id, amount, status, created_at)
       VALUES (?, ?, 'pending', datetime('now'))`,
      [userId, amount]
    );

    // Notify user
    sendEmail(
      req.user.email,
      "Withdrawal Requested",
      `<p>Your withdrawal request of ₦${amount} has been submitted and is pending approval.</p>`
    );

    res.json({ message: "Withdrawal request submitted!" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

/* -------------------------------------------
   USER - Get Own Withdrawals
-------------------------------------------- */
router.get("/user/withdrawals", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await initDB();

    const withdrawals = await db.all(
      `SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    res.json(withdrawals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch withdrawals" });
  }
});

/* -------------------------------------------
   USER - Get Wallet (Balance + Transactions)
-------------------------------------------- */
router.get("/user/wallet", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await initDB();

    const user = await db.get(
      `SELECT wallet_balance FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const transactions = await db.all(
      `SELECT id, amount, type, description, created_at
       FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ balance: user.wallet_balance, transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load wallet data" });
  }
});

/* -------------------------------------------
   ADMIN - View All Withdrawals
-------------------------------------------- */
router.get("/admin/withdrawals", verifyToken, async (req, res) => {
  try {
    const db = await initDB();

    const withdrawals = await db.all(
      `SELECT w.*, u.full_name AS name, u.email
       FROM withdrawals w
       LEFT JOIN users u ON w.user_id = u.id
       ORDER BY w.created_at DESC`
    );

    res.json(withdrawals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch withdrawals" });
  }
});

/* -------------------------------------------
   ADMIN - Approve or Reject Withdrawal
-------------------------------------------- */
router.put("/admin/withdrawals/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body; // approved | rejected
    const { id } = req.params;
    const db = await initDB();

    const withdrawal = await db.get(
      `SELECT * FROM withdrawals WHERE id = ?`,
      [id]
    );
    if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });

    const userData = await db.get(
      `SELECT email FROM users WHERE id = ?`,
      [withdrawal.user_id]
    );

    // Refund wallet if rejected
    if (status === "rejected") {
      await creditWallet(withdrawal.user_id, withdrawal.amount, "Withdrawal Rejected - Refund");
    }

    await db.run(
      `UPDATE withdrawals SET status = ? WHERE id = ?`,
      [status, id]
    );

    sendEmail(
      userData.email,
      `Withdrawal ${status}`,
      `<p>Your withdrawal of ₦${withdrawal.amount} is now <b>${status}</b>.</p>`
    );

    res.json({ message: "Withdrawal status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update withdrawal status" });
  }
});

export default router;

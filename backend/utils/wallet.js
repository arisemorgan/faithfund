import { initDB } from "../db.js";

/* ============================================
   CREDIT USER WALLET
   Adds money to wallet
============================================ */
export async function creditWallet(userId, amount, description = "Wallet Credit") {
  const db = await initDB();

  if (amount <= 0) throw new Error("Invalid credit amount");

  // Update wallet balance
  await db.run(
    `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
    [amount, userId]
  );

  // Save transaction
  await db.run(
    `INSERT INTO transactions (user_id, type, amount, status, reference)
     VALUES (?, "credit", ?, "completed", ?)`,
    [userId, amount, `CR-${Date.now()}`]
  );

  return true;
}

/* ============================================
   DEBIT USER WALLET
   Ensures user has enough funds
============================================ */
export async function debitWallet(userId, amount, description = "Wallet Debit") {
  const db = await initDB();

  if (amount <= 0) throw new Error("Invalid debit amount");

  // Get the current wallet balance
  const user = await db.get(
    `SELECT wallet_balance FROM users WHERE id = ?`,
    [userId]
  );

  if (!user) throw new Error("User not found");

  if (user.wallet_balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  // Deduct funds
  await db.run(
    `UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?`,
    [amount, userId]
  );

  // Log transaction
  await db.run(
    `INSERT INTO transactions (user_id, type, amount, status, reference)
     VALUES (?, "debit", ?, "completed", ?)`,
    [userId, amount, `DB-${Date.now()}`]
  );

  return true;
}

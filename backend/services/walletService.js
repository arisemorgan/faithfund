import { initDB } from "../db.js";

export const creditWallet = async (userId, amount, description) => {
  const db = await initDB();

  await db.run(
    `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
    [amount, userId]
  );

  await db.run(
    `INSERT INTO wallet_transactions (user_id, type, amount, description)
     VALUES (?, "credit", ?, ?)`,
    [userId, amount, description]
  );
};

export const debitWallet = async (userId, amount, description) => {
  const db = await initDB();

  const user = await db.get(
    `SELECT wallet_balance FROM users WHERE id = ?`,
    [userId]
  );

  if (user.wallet_balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  await db.run(
    `UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?`,
    [amount, userId]
  );

  await db.run(
    `INSERT INTO wallet_transactions (user_id, type, amount, description)
     VALUES (?, "debit", ?, ?)`,
    [userId, amount, description]
  );
};

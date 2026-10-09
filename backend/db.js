// db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let dbInstance = null;

/**
 * Initializes database connection automatically:
 * - SQLite for local dev
 * - MySQL for cPanel
 * 
 * Includes one-time migration (SQLite → MySQL)
 */
export async function initDB() {
  if (dbInstance) return dbInstance;

  const dbType = process.env.DB_TYPE?.trim() || "sqlite";

  if (dbType === "mysql") {
    // ======================
    // 🟢 MYSQL (Production)
    // ======================
    console.log("🟢 Using MySQL database...");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    dbInstance = {
      all: async (query, params = []) => {
        const [rows] = await connection.execute(query, params);
        return rows;
      },
      run: async (query, params = []) => {
        const [result] = await connection.execute(query, params);
        return result;
      },
      get: async (query, params = []) => {
        const [rows] = await connection.execute(query, params);
        return rows[0] || null;
      },
      close: async () => {
        await connection.end();
      },
    };

    // Ensure all tables exist
    await ensureTables(dbInstance, "mysql");

    // If SQLite DB exists, migrate data once
    if (fs.existsSync(process.env.DB_FILE || "./faithfund.db")) {
      await migrateFromSQLite(dbInstance);
    }

    return dbInstance;
  } else {
    // ======================
    // 🟣 SQLITE (Local Dev)
    // ======================
    console.log("🟣 Using SQLite database...");
    const db = await open({
      filename: process.env.DB_FILE || "./faithfund.db",
      driver: sqlite3.Database,
    });

    dbInstance = db;
    await ensureTables(db, "sqlite");
    return dbInstance;
  }
}

/**
 * Ensures required tables exist without touching data
 */
async function ensureTables(db, type) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
      full_name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'donor',
      status TEXT DEFAULT 'Pending',
      verified INTEGER DEFAULT '0',
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expires INTEGER,
      profile_photo TEXT,
      bank_name TEXT,
      account_number TEXT,
      account_name TEXT
      wallet_balance REAL DEFAULT '0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      goal_amount REAL NOT NULL,
      amount_raised REAL DEFAULT 0,
      image_url TEXT,
      images_json TEXT,
      video_url TEXT,
      slug TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      featured INTEGER DEFAULT 0, -- 🟢 0 = not featured, 1 = featured
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
      campaign_id INTEGER,
      user_id INTEGER,
      donor_name TEXT,
      donor_email TEXT,
      amount REAL,
      transaction_ref TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS church_channels (
      id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
      name TEXT,
      youtube_url TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
      btc_address TEXT,
      btc_qr TEXT,
      usdt_address TEXT,
      usdt_qr TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
      user_id INTEGER,
      campaign_id INTEGER,
      amount REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

   `CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
    user_id INTEGER,
    type TEXT, -- credit | debit
    amount REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
    );`,

   `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,          -- withdrawal | deposit | donation | refund
    amount REAL NOT NULL,
    status TEXT NOT NULL,        -- pending | completed | failed
    reference TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

   `CREATE TABLE IF NOT EXISTS kyc (
    id INTEGER PRIMARY KEY ${type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"},
    user_id INTEGER NOT NULL,
    bvn TEXT,
    nin TEXT,
    passport_url TEXT,
    driver_license_url TEXT,
    national_id_url TEXT,
    utility_bill_url TEXT,
    status TEXT DEFAULT 'pending',   -- pending | approved | rejected
    admin_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
    );`,




  ];

  for (const q of queries) {
    await db.run ? db.run(q) : db.all(q);
  }

  console.log("✅ Tables verified/created successfully.");
}

/**
 * One-time migration from SQLite → MySQL
 */
async function migrateFromSQLite(mysqlDB) {
  console.log("⚙️ Checking for SQLite data to migrate...");

  const sqlitePath = process.env.DB_FILE || "./faithfund.db";
  const sqliteDB = await open({
    filename: sqlitePath,
    driver: sqlite3.Database,
  });

  const tables = ["users", "campaigns", "donations", "church_channels", "settings", "withdrawals", "wallet_transactions","transactions"];

  for (const table of tables) {
    const rows = await sqliteDB.all(`SELECT * FROM ${table}`);
    if (rows.length === 0) continue;

    console.log(`⬆️ Migrating ${rows.length} record(s) from ${table}...`);

    for (const row of rows) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map(() => "?").join(",");

      await mysqlDB.run(
        `INSERT IGNORE INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`,
        values
      );
    }
  }

  console.log("✅ Migration complete. All data copied safely to MySQL.");
  await sqliteDB.close();
}

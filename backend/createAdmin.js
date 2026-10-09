import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS campaigns", (err) => {
    if (err) console.error("❌ Drop failed:", err.message);
    else console.log("✅ Old campaigns table removed");

    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        goal_amount REAL NOT NULL,
        amount_raised REAL DEFAULT 0,
        image_url TEXT,
        video_url TEXT,
        slug TEXT UNIQUE,
        status TEXT DEFAULT 'pending',
        featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `, (err2) => {
      if (err2) console.error("❌ Create failed:", err2.message);
      else console.log("✅ New campaigns table created");
    });
  });
});

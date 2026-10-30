/**
 * RP Organics - Offline SQLite Database Layer
 * Location: database/rp_organics.db
 * Brand: RP Organics | Owner: Rani Pavunrasu | FSSAI Lic No: 22426431000125
 */

const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const DB_DIR = path.join(__dirname, '..', 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'rp_organics.db');

let dbInstance = null;

function getDatabase() {
  if (dbInstance) return dbInstance;

  try {
    const Database = require('better-sqlite3');
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    console.log(`[Database] Connected to SQLite via better-sqlite3 at: ${DB_PATH}`);
  } catch (err) {
    console.warn('[Database] better-sqlite3 load failed, attempting node:sqlite fallback...', err.message);
    try {
      const { DatabaseSync } = require('node:sqlite');
      const rawDb = new DatabaseSync(DB_PATH);
      
      // Adapt node:sqlite to standard query API
      dbInstance = {
        prepare: (sql) => {
          const stmt = rawDb.prepare(sql);
          return {
            run: (...params) => {
              const res = stmt.run(...params);
              return { changes: res.changes, lastInsertRowid: Number(res.lastInsertRowid || 0) };
            },
            all: (...params) => stmt.all(...params),
            get: (...params) => stmt.get(...params)
          };
        },
        exec: (sql) => rawDb.exec(sql),
        close: () => rawDb.close()
      };
      console.log(`[Database] Connected to SQLite via node:sqlite at: ${DB_PATH}`);
    } catch (fallbackErr) {
      console.error('[Database] Failed to initialize SQLite database:', fallbackErr);
      throw fallbackErr;
    }
  }

  initTables(dbInstance);
  return dbInstance;
}

function initTables(db) {
  // 1. Contact Form Submissions
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Newsletter Subscriptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      source_page TEXT DEFAULT 'Homepage',
      status TEXT DEFAULT 'Subscribed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Product Reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      product_name TEXT,
      customer_name TEXT NOT NULL,
      email TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review_title TEXT,
      review_message TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Order & Checkout Enquiries
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      landmark TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT NOT NULL,
      order_notes TEXT,
      ordered_products TEXT NOT NULL,
      total_quantity INTEGER DEFAULT 1,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      cod_charge REAL DEFAULT 0,
      shipping_charge REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      is_free_cod INTEGER DEFAULT 0,
      coupon_code TEXT,
      payment_method TEXT DEFAULT 'UPI',
      payment_status TEXT DEFAULT 'Payment Pending',
      upi_transaction_id TEXT,
      payment_screenshot TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure migrations for existing order_enquiries tables
  const orderColumnsToEnsure = [
    { name: 'landmark', type: 'TEXT' },
    { name: 'order_notes', type: 'TEXT' },
    { name: 'subtotal', type: 'REAL DEFAULT 0' },
    { name: 'discount_amount', type: 'REAL DEFAULT 0' },
    { name: 'cod_charge', type: 'REAL DEFAULT 0' },
    { name: 'shipping_charge', type: 'REAL DEFAULT 0' },
    { name: 'is_free_cod', type: 'INTEGER DEFAULT 0' },
    { name: 'payment_status', type: "TEXT DEFAULT 'Payment Pending'" },
    { name: 'upi_transaction_id', type: 'TEXT' },
    { name: 'payment_screenshot', type: 'TEXT' },
    { name: 'razorpay_order_id', type: 'TEXT' },
    { name: 'razorpay_payment_id', type: 'TEXT' },
    { name: 'razorpay_signature', type: 'TEXT' }
  ];

  orderColumnsToEnsure.forEach(col => {
    try {
      db.exec(`ALTER TABLE order_enquiries ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {
      // Column already exists - ignore
    }
  });

  // 5. Account Registrations (Users)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Payment Settings (Razorpay & UPI Configuration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      razorpay_key_id TEXT DEFAULT '',
      razorpay_key_secret TEXT DEFAULT '',
      razorpay_enabled INTEGER DEFAULT 0,
      upi_id TEXT DEFAULT 'benseethalrani@okicici',
      upi_name TEXT DEFAULT 'Benseethal Rani',
      upi_qr_image TEXT DEFAULT 'assets/images/upi-qr-code.jpg',
      upi_enabled INTEGER DEFAULT 1,
      cod_enabled INTEGER DEFAULT 1,
      cod_fee REAL DEFAULT 65.0,
      free_cod_threshold REAL DEFAULT 1000.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    db.prepare(`
      INSERT OR IGNORE INTO payment_settings 
      (id, razorpay_key_id, razorpay_key_secret, razorpay_enabled, upi_id, upi_name, upi_qr_image, upi_enabled, cod_enabled, cod_fee, free_cod_threshold)
      VALUES (1, '', '', 0, 'benseethalrani@okicici', 'Benseethal Rani', 'assets/images/upi-qr-code.jpg', 1, 1, 65.0, 1000.0)
    `).run();
  } catch (e) {
    // Already present
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'payments');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  console.log('[Database] All SQLite tables and payment settings initialized successfully.');
}

module.exports = {
  getDatabase,
  DB_PATH
};

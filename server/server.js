/**
 * RP Organics - Offline Backend Server & API
 * Brand: RP Organics | Owner: Rani Pavunrasu | FSSAI Lic No: 22426431000125
 * Powered by Express + SQLite (better-sqlite3 / node:sqlite) + bcryptjs
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin@rporganics';

// Initialize Database
const db = getDatabase();

// In-Memory Admin Sessions & Rate Limiter
const activeAdminTokens = new Set();
const ipRequestCounts = new Map();

// Clear rate limiter map every minute
setInterval(() => ipRequestCounts.clear(), 60000);

// Basic Rate Limiting Middleware for API
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const current = ipRequestCounts.get(ip) || 0;
  if (current > 120) { // 120 requests/min limit
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again in a minute.' });
  }
  ipRequestCounts.set(ip, current + 1);
  next();
}

// Admin Authentication Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token;
  if (!token || !activeAdminTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Admin login required.' });
  }
  next();
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Seed default demo user if empty
try {
  const existingUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!existingUser) {
    const demoHash = bcrypt.hashSync('organic123', 10);
    db.prepare(`
      INSERT INTO users (full_name, email, phone, password_hash, status)
      VALUES (?, ?, ?, ?, 'Active')
    `).run('Rahul Sharma', 'user@rporganics.com', '9150300641', demoHash);
    console.log('[Auth] Seeded default demo user: user@rporganics.com / organic123');
  }
} catch (e) {
  console.warn('[Auth] Demo user check:', e.message);
}

// -------------------------------------------------------------
// 1. CONTACT FORM SUBMISSION
// -------------------------------------------------------------
app.post('/api/contact', rateLimit, (req, res) => {
  try {
    const { full_name, email, phone, subject, message } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please write your message.' });
    }

    const stmt = db.prepare(`
      INSERT INTO contact_submissions (full_name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'New')
    `);
    const info = stmt.run(
      full_name.trim(),
      email.trim().toLowerCase(),
      (phone || '').trim(),
      (subject || 'General Inquiry').trim(),
      message.trim()
    );

    res.json({
      success: true,
      message: '✅ Message sent successfully! Our customer support team will contact you within 2 hours.',
      id: info.lastInsertRowid
    });
  } catch (err) {
    console.error('Contact submission error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while saving contact message.' });
  }
});

// -------------------------------------------------------------
// 2. NEWSLETTER SUBSCRIPTION
// -------------------------------------------------------------
app.post('/api/newsletter', rateLimit, (req, res) => {
  try {
    const { email, source_page } = req.body;

    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const source = (source_page || 'Homepage').trim();

    // Check for duplicate subscription
    const existing = db.prepare('SELECT id, status FROM newsletter_subscriptions WHERE LOWER(email) = ?').get(cleanEmail);

    if (existing) {
      if (existing.status === 'Subscribed') {
        return res.status(200).json({
          success: true,
          alreadySubscribed: true,
          message: '✓ You are already subscribed to the RP Organics newsletter!'
        });
      } else {
        // Resubscribe if previously unsubscribed
        db.prepare("UPDATE newsletter_subscriptions SET status = 'Subscribed' WHERE id = ?").run(existing.id);
        return res.json({
          success: true,
          message: '🎉 Welcome back! Your newsletter subscription has been renewed.'
        });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO newsletter_subscriptions (email, source_page, status)
      VALUES (?, ?, 'Subscribed')
    `);
    const info = stmt.run(cleanEmail, source);

    res.json({
      success: true,
      message: '🎉 Thank you for subscribing! Your ₹150 welcome voucher has been activated.',
      id: info.lastInsertRowid
    });
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while saving newsletter subscription.' });
  }
});

// -------------------------------------------------------------
// 3. PRODUCT REVIEWS & RATINGS
// -------------------------------------------------------------
app.post('/api/review', rateLimit, (req, res) => {
  try {
    const { product_id, product_name, customer_name, email, rating, review_title, review_message } = req.body;

    if (!product_id || !product_id.trim()) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }
    if (!review_message || !review_message.trim()) {
      return res.status(400).json({ success: false, message: 'Please write your review feedback.' });
    }

    const stmt = db.prepare(`
      INSERT INTO product_reviews (product_id, product_name, customer_name, email, rating, review_title, review_message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `);
    const info = stmt.run(
      product_id.trim(),
      (product_name || product_id).trim(),
      customer_name.trim(),
      (email || '').trim().toLowerCase(),
      numRating,
      (review_title || 'Verified Customer Review').trim(),
      review_message.trim()
    );

    res.json({
      success: true,
      message: '⭐ Thank you! Your review has been submitted successfully and will appear once verified.',
      id: info.lastInsertRowid
    });
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while saving review.' });
  }
});

// Public: Get Approved Reviews for a product
app.get('/api/reviews', (req, res) => {
  try {
    const { productId } = req.query;
    let reviews;
    if (productId) {
      reviews = db.prepare(`
        SELECT id, product_id, product_name, customer_name, rating, review_title, review_message, created_at
        FROM product_reviews
        WHERE product_id = ? AND status = 'Approved'
        ORDER BY created_at DESC
      `).all(productId);
    } else {
      reviews = db.prepare(`
        SELECT id, product_id, product_name, customer_name, rating, review_title, review_message, created_at
        FROM product_reviews
        WHERE status = 'Approved'
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
    }
    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Fetch reviews error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
});

// -------------------------------------------------------------
// 4. PAYMENT CONFIGURATION & SETTINGS
// -------------------------------------------------------------
app.get('/api/payment-config', (req, res) => {
  try {
    let settings = db.prepare(`
      SELECT razorpay_key_id, razorpay_enabled, upi_id, upi_name, upi_qr_image, upi_enabled, cod_enabled, cod_fee, free_cod_threshold 
      FROM payment_settings WHERE id = 1
    `).get();

    if (!settings) {
      settings = {
        razorpay_key_id: '',
        razorpay_enabled: 0,
        upi_id: 'benseethalrani@okicici',
        upi_name: 'Benseethal Rani',
        upi_qr_image: 'assets/images/upi-qr-code.jpg',
        upi_enabled: 1,
        cod_enabled: 1,
        cod_fee: 65.0,
        free_cod_threshold: 1000.0
      };
    }

    res.json({ success: true, config: settings });
  } catch (err) {
    console.error('Payment config fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to load payment configuration.' });
  }
});

// Helper: Razorpay Orders REST API via HTTPS
function callRazorpayOrdersApi(keyId, keySecret, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': authHeader
      }
    };

    const req = https.request(options, (resp) => {
      let body = '';
      resp.on('data', chunk => body += chunk);
      resp.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (resp.statusCode >= 200 && resp.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error ? parsed.error.description : `Razorpay error: ${resp.statusCode}`));
          }
        } catch (e) {
          reject(new Error('Invalid response from Razorpay: ' + body));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

// -------------------------------------------------------------
// 5. RETIRED CHECKOUT & PAYMENT ENDPOINTS (MIGRATED TO WHATSAPP)
// -------------------------------------------------------------
// Direct customer ordering now occurs via WhatsApp (+91 9150300641).
// These endpoints are safely retired without deleting historical orders or admin records.
const retiredEndpointHandler = (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Website checkout and online payment endpoints have been retired. RP Organics now accepts orders directly through WhatsApp at +91 9150300641.',
    whatsapp_number: '+919150300641',
    order_list_url: '/cart.html'
  });
};

app.post('/api/order-enquiry', rateLimit, retiredEndpointHandler);
app.post('/api/orders/confirm-upi', rateLimit, retiredEndpointHandler);
app.post('/api/razorpay/create-order', rateLimit, retiredEndpointHandler);
app.post('/api/razorpay/verify', rateLimit, retiredEndpointHandler);

// Historical Order Lookup (Read-Only)
app.get('/api/orders/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare('SELECT * FROM order_enquiries WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    console.error('Fetch order error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
});

// -------------------------------------------------------------
// 5. CUSTOMER REGISTRATION & LOGIN
// -------------------------------------------------------------
app.post('/api/register', rateLimit, async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // Secure password hashing
    const passwordHash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (full_name, email, phone, password_hash, status)
      VALUES (?, ?, ?, ?, 'Active')
    `);
    const info = stmt.run(full_name.trim(), cleanEmail, (phone || '').trim(), passwordHash);

    res.json({
      success: true,
      message: '🎉 Account created successfully! Welcome to RP Organics.',
      user: {
        id: info.lastInsertRowid,
        name: full_name.trim(),
        email: cleanEmail,
        phone: (phone || '').trim()
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while registering account.' });
  }
});

app.post('/api/login', rateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email. Please register.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'This account is currently disabled. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    res.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error while signing in.' });
  }
});

// -------------------------------------------------------------
// 6. ADMIN AUTH & DASHBOARD API
// -------------------------------------------------------------
app.post('/api/admin/login', rateLimit, (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString('hex');
    activeAdminTokens.add(token);
    return res.json({ success: true, message: 'Admin authentication successful.', token });
  }
  return res.status(401).json({ success: false, message: 'Invalid admin username or password.' });
});

// Get all submissions for Admin
app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contact_submissions ORDER BY created_at DESC').all();
    const newsletters = db.prepare('SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC').all();
    const reviews = db.prepare('SELECT * FROM product_reviews ORDER BY created_at DESC').all();
    const orders = db.prepare('SELECT * FROM order_enquiries ORDER BY created_at DESC').all();
    const users = db.prepare('SELECT id, full_name, email, phone, status, created_at FROM users ORDER BY created_at DESC').all();

    res.json({
      success: true,
      counts: {
        orders: orders.length,
        contacts: contacts.length,
        newsletters: newsletters.length,
        reviews: reviews.length,
        users: users.length
      },
      data: {
        orders,
        contacts,
        newsletters,
        reviews,
        users
      }
    });
  } catch (err) {
    console.error('Admin submissions fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin submissions.' });
  }
});

// Update status of any submission
app.patch('/api/admin/submissions/:type/:id', requireAdmin, (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const tableMap = {
      contact: 'contact_submissions',
      newsletter: 'newsletter_subscriptions',
      review: 'product_reviews',
      order: 'order_enquiries',
      user: 'users'
    };

    const tableName = tableMap[type];
    if (!tableName) {
      return res.status(400).json({ success: false, message: 'Invalid submission type.' });
    }

    db.prepare(`UPDATE ${tableName} SET status = ? WHERE id = ?`).run(status, id);
    res.json({ success: true, message: `Status updated to "${status}" successfully.` });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update submission status.' });
  }
});

// Delete a submission
app.delete('/api/admin/submissions/:type/:id', requireAdmin, (req, res) => {
  try {
    const { type, id } = req.params;
    const tableMap = {
      contact: 'contact_submissions',
      newsletter: 'newsletter_subscriptions',
      review: 'product_reviews',
      order: 'order_enquiries',
      user: 'users'
    };

    const tableName = tableMap[type];
    if (!tableName) {
      return res.status(400).json({ success: false, message: 'Invalid submission type.' });
    }

    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) {
    console.error('Admin delete record error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete record.' });
  }
});

// Admin Payment Settings Management
app.get('/api/admin/settings/payment', requireAdmin, (req, res) => {
  try {
    let settings = db.prepare('SELECT * FROM payment_settings WHERE id = 1').get();
    if (!settings) {
      settings = {
        razorpay_key_id: '',
        razorpay_key_secret: '',
        razorpay_enabled: 0,
        upi_id: 'benseethalrani@okicici',
        upi_name: 'Benseethal Rani',
        upi_qr_image: 'assets/images/upi-qr-code.jpg',
        upi_enabled: 1,
        cod_enabled: 1,
        cod_fee: 65.0,
        free_cod_threshold: 1000.0
      };
    }
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Fetch payment settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment settings.' });
  }
});

app.post('/api/admin/settings/payment', requireAdmin, (req, res) => {
  try {
    const {
      razorpay_key_id,
      razorpay_key_secret,
      razorpay_enabled,
      upi_id,
      upi_name,
      upi_qr_image,
      upi_enabled,
      cod_enabled,
      cod_fee,
      free_cod_threshold
    } = req.body;

    db.prepare(`
      INSERT INTO payment_settings (
        id, razorpay_key_id, razorpay_key_secret, razorpay_enabled,
        upi_id, upi_name, upi_qr_image, upi_enabled,
        cod_enabled, cod_fee, free_cod_threshold, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        razorpay_key_id = excluded.razorpay_key_id,
        razorpay_key_secret = excluded.razorpay_key_secret,
        razorpay_enabled = excluded.razorpay_enabled,
        upi_id = excluded.upi_id,
        upi_name = excluded.upi_name,
        upi_qr_image = excluded.upi_qr_image,
        upi_enabled = excluded.upi_enabled,
        cod_enabled = excluded.cod_enabled,
        cod_fee = excluded.cod_fee,
        free_cod_threshold = excluded.free_cod_threshold,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      (razorpay_key_id || '').trim(),
      (razorpay_key_secret || '').trim(),
      razorpay_enabled ? 1 : 0,
      (upi_id || 'benseethalrani@okicici').trim(),
      (upi_name || 'Benseethal Rani').trim(),
      (upi_qr_image || 'assets/images/upi-qr-code.jpg').trim(),
      upi_enabled ? 1 : 0,
      cod_enabled ? 1 : 0,
      parseFloat(cod_fee) || 65.0,
      parseFloat(free_cod_threshold) || 1000.0
    );

    res.json({
      success: true,
      message: '✅ Payment settings saved successfully into SQLite database.'
    });
  } catch (err) {
    console.error('Save payment settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to update payment settings: ' + err.message });
  }
});

// Admin Update Order Payment Status
app.patch('/api/admin/orders/:id/payment-status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!payment_status) {
      return res.status(400).json({ success: false, message: 'Payment status is required.' });
    }

    db.prepare('UPDATE order_enquiries SET payment_status = ? WHERE id = ?').run(payment_status, id);
    res.json({ success: true, message: `Payment status updated to "${payment_status}" successfully.` });
  } catch (err) {
    console.error('Update payment status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update payment status.' });
  }
});

// -------------------------------------------------------------
// 8. CSV EXPORT ENDPOINT
// -------------------------------------------------------------
app.get('/api/admin/export/:type', requireAdmin, (req, res) => {
  try {
    const { type } = req.params;
    let rows = [];
    let filename = `rp_organics_${type}_${Date.now()}.csv`;

    if (type === 'contacts') {
      rows = db.prepare('SELECT id, full_name, email, phone, subject, message, status, created_at FROM contact_submissions ORDER BY id DESC').all();
    } else if (type === 'newsletters') {
      rows = db.prepare('SELECT id, email, source_page, status, created_at FROM newsletter_subscriptions ORDER BY id DESC').all();
    } else if (type === 'reviews') {
      rows = db.prepare('SELECT id, product_id, product_name, customer_name, email, rating, review_title, review_message, status, created_at FROM product_reviews ORDER BY id DESC').all();
    } else if (type === 'orders') {
      rows = db.prepare('SELECT id, order_number, customer_name, phone, email, delivery_address, landmark, city, state, pincode, order_notes, total_quantity, subtotal, discount_amount, cod_charge, shipping_charge, total_amount, is_free_cod, coupon_code, payment_method, payment_status, upi_transaction_id, status, created_at FROM order_enquiries ORDER BY id DESC').all();
    } else if (type === 'users') {
      rows = db.prepare('SELECT id, full_name, email, phone, status, created_at FROM users ORDER BY id DESC').all();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export type.' });
    }

    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send('No data available\n');
    }

    // Convert to CSV
    const headers = Object.keys(rows[0]);
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = headers.map(escapeCsv).join(',') + '\n';
    rows.forEach(row => {
      csvContent += headers.map(h => escapeCsv(row[h])).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate CSV export.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'RP Organics',
    fssai: '22426431000125',
    database: 'SQLite (database/rp_organics.db)',
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// 8. SERVE STATIC FRONTEND
// -------------------------------------------------------------
app.get(['/checkout', '/checkout.html'], (req, res) => {
  res.redirect(302, '/cart.html');
});

app.get(['/components-showcase', '/components-showcase.html'], (req, res) => {
  res.redirect(301, '/');
});

app.use(express.static(path.join(__dirname, '..'), {
  extensions: ['html', 'htm']
}));

// Fallback to index.html for undefined non-API paths (Express 5 compatible)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌿 RP Organics Offline Server & Database Running!`);
  console.log(`🌐 Website URL:       http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard:   http://localhost:${PORT}/admin.html`);
  console.log(`🗄️ Database Path:     database/rp_organics.db`);
  console.log(`🔑 Admin Login:       Username: ${ADMIN_USER} | Password: ${ADMIN_PASS}`);
  console.log(`======================================================\n`);
});

/**
 * RP Organics - Offline Database Viewer CLI
 * Run with: npm run view-db OR node server/view-cli.js
 */

const { getDatabase, DB_PATH } = require('./db');

try {
  const db = getDatabase();

  console.log('\n========================================================================');
  console.log('🌿 RP ORGANICS - LOCAL OFFLINE DATABASE VIEWER');
  console.log(`🗄️ Database: ${DB_PATH}`);
  console.log('========================================================================\n');

  // 1. Orders
  console.log('📦 1. ORDER & CHECKOUT ENQUIRIES:');
  const orders = db.prepare('SELECT id, order_number, customer_name, phone, email, total_amount, payment_method, status, created_at FROM order_enquiries ORDER BY id DESC LIMIT 15').all();
  if (orders.length === 0) {
    console.log('   (No orders recorded yet)\n');
  } else {
    console.table(orders);
    console.log('');
  }

  // 2. Contacts
  console.log('✉️ 2. CONTACT FORM SUBMISSIONS:');
  const contacts = db.prepare('SELECT id, full_name, email, phone, subject, status, created_at FROM contact_submissions ORDER BY id DESC LIMIT 15').all();
  if (contacts.length === 0) {
    console.log('   (No contact submissions yet)\n');
  } else {
    console.table(contacts);
    console.log('');
  }

  // 3. Newsletters
  console.log('📰 3. NEWSLETTER SUBSCRIBERS:');
  const subs = db.prepare('SELECT id, email, source_page, status, created_at FROM newsletter_subscriptions ORDER BY id DESC LIMIT 15').all();
  if (subs.length === 0) {
    console.log('   (No newsletter subscribers yet)\n');
  } else {
    console.table(subs);
    console.log('');
  }

  // 4. Reviews
  console.log('⭐ 4. PRODUCT REVIEWS:');
  const reviews = db.prepare('SELECT id, product_name, customer_name, rating, review_title, status, created_at FROM product_reviews ORDER BY id DESC LIMIT 15').all();
  if (reviews.length === 0) {
    console.log('   (No product reviews yet)\n');
  } else {
    console.table(reviews);
    console.log('');
  }

  // 5. Users
  console.log('👥 5. REGISTERED CUSTOMERS:');
  const users = db.prepare('SELECT id, full_name, email, phone, status, created_at FROM users ORDER BY id DESC LIMIT 15').all();
  if (users.length === 0) {
    console.log('   (No registered customers yet)\n');
  } else {
    console.table(users);
    console.log('');
  }

  console.log('========================================================================\n');
} catch (err) {
  console.error('Error viewing database:', err.message);
  process.exit(1);
}

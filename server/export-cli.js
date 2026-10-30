/**
 * RP Organics - Offline Database CSV Exporter CLI
 * Exports all customer submissions to database/exports/ folder in CSV format.
 * Run with: npm run export-csv OR node server/export-cli.js
 */

const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./db');

const EXPORT_DIR = path.join(__dirname, '..', 'database', 'exports');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const db = getDatabase();

const tablesToExport = [
  { name: 'order_enquiries', file: 'orders.csv' },
  { name: 'contact_submissions', file: 'contacts.csv' },
  { name: 'newsletter_subscriptions', file: 'newsletter.csv' },
  { name: 'product_reviews', file: 'reviews.csv' },
  { name: 'users', file: 'users.csv', query: 'SELECT id, full_name, email, phone, status, created_at FROM users' }
];

console.log('\n======================================================');
console.log('🌿 RP Organics - Exporting Database to CSV Files');
console.log(`📁 Target Directory: ${EXPORT_DIR}`);
console.log('======================================================\n');

const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

tablesToExport.forEach(item => {
  const query = item.query || `SELECT * FROM ${item.name} ORDER BY id DESC`;
  const rows = db.prepare(query).all();

  const filePath = path.join(EXPORT_DIR, item.file);

  if (rows.length === 0) {
    fs.writeFileSync(filePath, 'No records found\n', 'utf8');
    console.log(`📄 ${item.file.padEnd(16)}: 0 records (empty file created)`);
    return;
  }

  const headers = Object.keys(rows[0]);
  let csv = headers.map(escapeCsv).join(',') + '\n';
  rows.forEach(r => {
    csv += headers.map(h => escapeCsv(r[h])).join(',') + '\n';
  });

  fs.writeFileSync(filePath, csv, 'utf8');
  console.log(`✅ ${item.file.padEnd(16)}: ${rows.length} records exported successfully -> ${filePath}`);
});

console.log('\nAll CSV exports completed!\n');

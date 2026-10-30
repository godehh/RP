/**
 * RP Organics - Database Initializer CLI
 * Creates database/rp_organics.db and all required schema tables.
 */

const { getDatabase, DB_PATH } = require('./db');

console.log('----------------------------------------------------');
console.log('🌿 RP Organics - Initializing Offline SQLite Database');
console.log('----------------------------------------------------');

try {
  const db = getDatabase();
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();

  console.log(`\n✅ Database successfully initialized at:`);
  console.log(`   ${DB_PATH}`);
  console.log(`\n📋 Created Tables:`);
  tables.forEach(t => {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
    console.log(`   - ${t.name.padEnd(28)} (${count} records)`);
  });
  console.log('\nReady for offline customer form submissions!\n');
} catch (err) {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
}

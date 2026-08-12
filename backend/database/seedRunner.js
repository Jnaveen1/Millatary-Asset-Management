const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function runSeed() {
  console.log('🔄 Initializing database schema and seed data...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

    console.log('📌 Running schema.sql...');
    await db.query(schemaSql);
    console.log('✅ Schema created successfully.');

    console.log('📌 Running seed.sql...');
    await db.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    // Update seed user passwords with valid bcryptjs hashes
    console.log('🔐 Hashing seed user passwords with bcryptjs...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await db.query('UPDATE users SET password_hash = $1', [hashedPassword]);
    console.log('✅ User passwords hashed successfully.');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error executing database seed:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;


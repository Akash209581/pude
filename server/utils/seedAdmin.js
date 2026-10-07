const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('../config/db');
const users = require('../models/userModel');

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'config', 'schema.sql'), 'utf8');
  await db.query(schema);

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const hash = await bcrypt.hash(password, 12);

  // Remove existing admin users to ensure old credentials are completely replaced
  await db.query("DELETE FROM users WHERE role = 'admin'");
  const user = await users.createAdmin(username, hash);

  console.log(`Admin ready: ${user.username}`);
  await db.pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await db.pool.end();
  process.exit(1);
});

/**
 * Admin Bootstrap Script (run deliberately — never on startup)
 *
 * Creates the first/primary administrator account from environment variables
 * (ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD). The password is read only
 * from the environment and is bcrypt-hashed before being stored; it is never
 * written to logs, files, or the database in plain text.
 *
 * Usage (inside the chat-app container):
 *   docker compose exec chat-app node src/scripts/create-admin.js
 *
 * Idempotent and safe:
 *   - If the username already exists as an admin, it exits without changes.
 *   - If the username exists with a non-admin role, it refuses to overwrite.
 */

const bcrypt = require('bcryptjs');
const db = require('../db');

const SALT_ROUNDS = 10;

async function main() {
  const username = (process.env.ADMIN_USERNAME || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase() || null;

  if (!username) {
    console.error('ADMIN_USERNAME is not set. Configure it in .env before running this script.');
    process.exit(1);
  }
  if (!password) {
    console.error('ADMIN_PASSWORD is not set. Configure it in .env before running this script.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  const existing = await db.query('SELECT id, role FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    const { role } = existing.rows[0];
    if (role === 'admin') {
      console.log(`Admin account "${username}" already exists (role=admin). No changes made.`);
      process.exit(0);
    }
    console.error(`Username "${username}" already exists with role "${role}". Refusing to overwrite.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await db.query(
    `INSERT INTO users (username, password_hash, email, display_name, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, username, email, display_name, role, created_at`,
    [username, passwordHash, email, username]
  );

  const admin = result.rows[0];
  console.log(`Admin account created: id=${admin.id} username=${admin.username} role=${admin.role}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to create admin account:', err.message);
    process.exit(1);
  });

require('dotenv').config(); // reads the .env file into process.env (local development)
const { Pool } = require('pg');

// Stop early with a clear message if the connection string is missing.
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Add it to your .env file (or Render environment variables).');
  process.exit(1);
}

const pool = new Pool({
  // The connection string holds host, user, password and sslmode=verify-full.
  // The sslmode part is what switches on the encrypted (SSL) connection Neon requires.
  connectionString: process.env.DATABASE_URL,
  max: 5,                         // at most 5 connections (Neon free tier has limits)
  idleTimeoutMillis: 30000,       // close a connection that has been idle for 30 seconds
  connectionTimeoutMillis: 10000, // wait up to 10 seconds (Neon may need time to wake up)
});

// If an idle connection breaks, log it instead of crashing the whole server.
pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

module.exports = pool;

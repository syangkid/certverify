// Checks that the app can reach Neon, and lists the tables and roles it finds.

const pool = require('../config/db');

async function testConnection() {
  try {
    const time = await pool.query('SELECT NOW() AS now, current_database() AS db');
    console.log('Connected to database:', time.rows[0].db, 'at', time.rows[0].now);

    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('Tables found:', tables.rows.map((row) => row.table_name).join(', ') || '(none yet)');

    const roles = await pool.query('SELECT role_name FROM roles ORDER BY role_id');
    console.log('Roles found:', roles.rows.map((row) => row.role_name).join(', '));
  } catch (err) {
    console.error('Database test failed:', err.message);
  } finally {
    await pool.end(); // close the pool so the script can exit
  }
}

testConnection();

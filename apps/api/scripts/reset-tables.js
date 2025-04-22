// reset-tables.js
const { Client } = require('pg');
require('dotenv').config();

async function resetTables() {
  // Connection to database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'github_tracker',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Drop tables in the correct order (respecting foreign key constraints)
    console.log('Dropping tables...');

    // First drop the release table as it depends on repository
    await client.query('DROP TABLE IF EXISTS release CASCADE');
    console.log('Release table dropped');

    // Then drop the repository table
    await client.query('DROP TABLE IF EXISTS repository CASCADE');
    console.log('Repository table dropped');

    console.log('All tables dropped successfully');
    console.log('The application will recreate the tables on next startup');
  } catch (error) {
    console.error('Error resetting tables:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetTables();

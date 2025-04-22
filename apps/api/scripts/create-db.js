// create-db.js
const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connection to PostgreSQL server (not the specific database)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if the database exists
    const dbName = process.env.DB_DATABASE || 'github_tracker';
    const checkResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );

    if (checkResult.rows.length === 0) {
      // Database doesn't exist, create it
      console.log(`Creating database: ${dbName}`);
      // Need to escape the database name to prevent SQL injection
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database ${dbName} created successfully!`);
    } else {
      console.log(`Database ${dbName} already exists!`);
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();

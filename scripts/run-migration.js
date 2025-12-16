const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.psehqmzxywbtlhpjxbel:VirginRevenue2024@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241215000000_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    console.log('\nPlease run the SQL manually in the Supabase Dashboard SQL Editor:');
    console.log('https://supabase.com/dashboard/project/psehqmzxywbtlhpjxbel/sql/new');
  } finally {
    await client.end();
  }
}

runMigration();

// Run database migrations
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running database migrations...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      return false;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Execute the migration
    console.log('🔧 Executing migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables created:');
    tables.rows.forEach(table => {
      console.log(`   ✓ ${table.table_name}`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Handle specific common errors
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist - migration may have been run before');
      return true;
    }
    
    return false;
  } finally {
    client.release();
  }
}

// Run migrations
runMigrations()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Database setup complete!');
      console.log('🎯 Next step: Run the test data script');
      console.log('   node scripts/create-test-data.js');
    } else {
      console.log('\n❌ Migration failed!');
      console.log('💡 Check your DATABASE_URL in .env.local');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
  });

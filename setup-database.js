#!/usr/bin/env node

/**
 * Database Setup Script
 * 1. Runs database migration to create tables
 * 2. Creates test user and sample data
 * 3. Tests database connectivity
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const sql = neon(process.env.DATABASE_URL);

async function checkDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully!');
    console.log(`⏰ Current time: ${result[0].current_time}\n`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure your DATABASE_URL is correct in .env.local\n');
    return false;
  }
}

async function runMigration() {
  console.log('📄 Running database migration...');
  
  try {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '001_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.includes('CREATE EXTENSION')) {
        try {
          await sql.unsafe(statement);
          console.log('✅ Extension created');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('ℹ️  Extension already exists');
          } else {
            console.log('⚠️  Extension error (might be okay):', error.message);
          }
        }
      } else if (statement.includes('CREATE TABLE')) {
        try {
          await sql.unsafe(statement);
          const tableName = statement.match(/CREATE TABLE (\w+)/i)?.[1];
          console.log(`✅ Table created: ${tableName}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            const tableName = statement.match(/CREATE TABLE (\w+)/i)?.[1];
            console.log(`ℹ️  Table already exists: ${tableName}`);
          } else {
            throw error;
          }
        }
      } else if (statement.includes('CREATE INDEX') || statement.includes('CREATE UNIQUE INDEX')) {
        try {
          await sql.unsafe(statement);
          const indexName = statement.match(/CREATE (?:UNIQUE )?INDEX (\w+)/i)?.[1];
          console.log(`✅ Index created: ${indexName}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            const indexName = statement.match(/CREATE (?:UNIQUE )?INDEX (\w+)/i)?.[1];
            console.log(`ℹ️  Index already exists: ${indexName}`);
          } else {
            throw error;
          }
        }
      } else if (statement.includes('CREATE OR REPLACE')) {
        try {
          await sql.unsafe(statement);
          const itemName = statement.match(/CREATE OR REPLACE (?:FUNCTION|VIEW) (\w+)/i)?.[1];
          console.log(`✅ Created/Updated: ${itemName}`);
        } catch (error) {
          throw error;
        }
      } else if (statement.includes('CREATE TRIGGER')) {
        try {
          await sql.unsafe(statement);
          const triggerName = statement.match(/CREATE TRIGGER (\w+)/i)?.[1];
          console.log(`✅ Trigger created: ${triggerName}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            const triggerName = statement.match(/CREATE TRIGGER (\w+)/i)?.[1];
            console.log(`ℹ️  Trigger already exists: ${triggerName}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function createTestData() {
  console.log('🧪 Creating test data...');
  
  try {
    // Create a test user (simulating a Clerk user)
    const testUserId = 'user_test_' + Date.now();
    console.log(`👤 Creating test user: ${testUserId}`);
    
    const user = await sql`
      INSERT INTO users (clerk_user_id, email, first_name, last_name)
      VALUES (${testUserId}, 'test@meetbrief.app', 'Test', 'User')
      ON CONFLICT (clerk_user_id) DO NOTHING
      RETURNING *
    `;
    
    let userId;
    if (user.length > 0) {
      userId = user[0].id;
      console.log('✅ Test user created');
    } else {
      // User already exists, get the ID
      const existingUser = await sql`
        SELECT id FROM users WHERE clerk_user_id = ${testUserId}
      `;
      userId = existingUser[0]?.id;
      console.log('ℹ️  Using existing test user');
    }
    
    if (!userId) {
      console.log('❌ Could not create or find test user');
      return false;
    }
    
    // Create a test transcript
    console.log('📄 Creating test transcript...');
    const transcript = await sql`
      INSERT INTO transcripts (
        user_id, title, file_name, file_url, file_size, file_type, 
        extracted_text, word_count, status
      )
      VALUES (
        ${userId},
        'Sample Team Meeting', 
        'team-meeting.txt',
        'https://example.com/sample.txt',
        1024,
        'txt',
        'This is a sample meeting transcript. We discussed project timelines, budget allocation, and next steps. Key action items include updating documentation, scheduling client calls, and preparing quarterly reports.',
        35,
        'completed'
      )
      RETURNING *
    `;
    
    const transcriptId = transcript[0].id;
    console.log('✅ Test transcript created');
    
    // Create test summaries
    console.log('📝 Creating test summaries...');
    
    const summaries = [
      {
        title: 'Team Meeting Summary',
        prompt: 'Please summarize this meeting transcript focusing on key decisions and action items.',
        summary: `# Team Meeting Summary

## Key Decisions Made
- Approved budget allocation for Q4 initiatives
- Decided to prioritize documentation updates
- Agreed to schedule weekly client check-ins

## Action Items
1. **Documentation Team**: Update all project docs by Friday
2. **Sales Team**: Schedule client calls for next week  
3. **Finance**: Prepare Q4 budget reports

## Next Meeting
- Date: Next Friday at 2 PM
- Agenda: Review progress on action items

This summary was generated using AI to highlight the most important points from the meeting.`,
        ai_model: 'llama-3.3-70b-versatile'
      },
      {
        title: 'Quick Action Items',
        prompt: 'Extract just the action items from this meeting.',
        summary: `# Action Items from Team Meeting

## Immediate Actions (This Week)
- [ ] Update project documentation (Due: Friday)
- [ ] Send client meeting invites (Due: Monday)
- [ ] Review budget allocations (Due: Wednesday)

## Follow-up Actions (Next Week)
- [ ] Client check-in calls
- [ ] Quarterly report preparation
- [ ] Team performance review

**Total Action Items**: 6
**Priority Level**: High`,
        ai_model: 'llama-3.3-70b-versatile'
      }
    ];
    
    for (const summaryData of summaries) {
      await sql`
        INSERT INTO summaries (
          transcript_id, user_id, title, prompt, summary, 
          ai_model, token_count, processing_time, status
        )
        VALUES (
          ${transcriptId}, ${userId}, ${summaryData.title}, ${summaryData.prompt},
          ${summaryData.summary}, ${summaryData.ai_model}, 
          ${summaryData.summary.length}, 1500, 'completed'
        )
      `;
      console.log(`✅ Created summary: ${summaryData.title}`);
    }
    
    console.log('\n🎉 Test data created successfully!');
    console.log('📊 Summary:');
    console.log(`   👤 Test user: ${testUserId}`);
    console.log(`   📄 1 transcript created`);
    console.log(`   📝 ${summaries.length} summaries created`);
    console.log('\n💡 You can now see data in your dashboard!');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
    return false;
  }
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Check tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('📋 Tables found:');
    tables.forEach(table => console.log(`   ✓ ${table.table_name}`));
    
    // Check data counts
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const transcriptCount = await sql`SELECT COUNT(*) as count FROM transcripts`;
    const summaryCount = await sql`SELECT COUNT(*) as count FROM summaries`;
    
    console.log('\n📊 Data counts:');
    console.log(`   👤 Users: ${userCount[0].count}`);
    console.log(`   📄 Transcripts: ${transcriptCount[0].count}`);
    console.log(`   📝 Summaries: ${summaryCount[0].count}`);
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Main setup function
async function setupDatabase() {
  console.log('🚀 Starting Database Setup');
  console.log('='.repeat(50) + '\n');
  
  // Step 1: Check connection
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.log('❌ Setup failed - no database connection');
    return;
  }
  
  // Step 2: Run migration
  const migrated = await runMigration();
  if (!migrated) {
    console.log('❌ Setup failed - migration error');
    return;
  }
  
  // Step 3: Create test data
  const testDataCreated = await createTestData();
  if (!testDataCreated) {
    console.log('❌ Setup failed - could not create test data');
    return;
  }
  
  // Step 4: Verify everything
  const verified = await verifySetup();
  if (!verified) {
    console.log('❌ Setup completed but verification failed');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Database setup completed successfully!');
  console.log('\n🎯 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Visit: http://localhost:3000/dashboard');
  console.log('   3. You should now see summaries in your dashboard!');
  console.log('   4. Try the email sharing feature');
}

// Run the setup
setupDatabase().catch(console.error);

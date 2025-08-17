-- ===================================
-- MEETBRIEF DATABASE SCHEMA
-- Neon Postgres Migration v1.0
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- USERS TABLE
-- ===================================
-- Stores user information from Clerk
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    image_url TEXT,
    plan VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by Clerk user ID
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);

-- ===================================
-- TRANSCRIPTS TABLE  
-- ===================================
-- Stores uploaded transcript files and extracted text
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- UploadThing URL
    file_size BIGINT NOT NULL, -- in bytes
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'txt', 'audio', 'video'
    extracted_text TEXT, -- Extracted text content
    word_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    error_message TEXT, -- If processing failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX idx_transcripts_status ON transcripts(status);
CREATE INDEX idx_transcripts_created_at ON transcripts(created_at DESC);

-- ===================================
-- SUMMARIES TABLE
-- ===================================  
-- Stores AI-generated summaries of transcripts
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL, -- Custom user prompt
    summary TEXT NOT NULL, -- Generated summary
    ai_model VARCHAR(50) NOT NULL, -- 'groq', 'openai', etc.
    token_count INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0, -- in milliseconds
    status VARCHAR(20) DEFAULT 'generating', -- 'generating', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_summaries_transcript_id ON summaries(transcript_id);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE INDEX idx_summaries_status ON summaries(status);
CREATE INDEX idx_summaries_created_at ON summaries(created_at DESC);

-- ===================================
-- SENDS TABLE
-- ===================================
-- Tracks email shares of summaries
CREATE TABLE sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipients JSONB NOT NULL, -- Array of email addresses
    subject VARCHAR(255) NOT NULL,
    email_id VARCHAR(255), -- Resend email ID for tracking
    status VARCHAR(20) DEFAULT 'sending', -- 'sending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance and tracking
CREATE INDEX idx_sends_summary_id ON sends(summary_id);
CREATE INDEX idx_sends_user_id ON sends(user_id);
CREATE INDEX idx_sends_status ON sends(status);
CREATE INDEX idx_sends_sent_at ON sends(sent_at DESC);

-- ===================================
-- USER USAGE TRACKING (Optional)
-- ===================================
-- Track usage for rate limiting and billing
CREATE TABLE user_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) NOT NULL, -- 'transcript_upload', 'summary_generation', 'email_send'
    usage_count INTEGER DEFAULT 1,
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint to prevent duplicate daily entries
CREATE UNIQUE INDEX idx_user_usage_unique ON user_usage(user_id, usage_type, usage_date);
CREATE INDEX idx_user_usage_user_date ON user_usage(user_id, usage_date);

-- ===================================
-- TRIGGERS FOR UPDATED_AT
-- ===================================
-- Auto-update updated_at columns

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- SAMPLE DATA (Optional - for testing)
-- ===================================
/*
-- Insert a test user
INSERT INTO users (clerk_user_id, email, first_name, last_name) 
VALUES ('user_test123', 'test@example.com', 'Test', 'User');

-- Get the user ID for sample data
-- INSERT INTO transcripts (user_id, title, file_name, file_url, file_size, file_type, extracted_text, word_count, status)
-- VALUES (
--     (SELECT id FROM users WHERE clerk_user_id = 'user_test123'),
--     'Weekly Team Meeting', 
--     'team-meeting.pdf',
--     'https://uploadthing.com/f/abc123',
--     1024000,
--     'pdf',
--     'Sample meeting transcript content...',
--     250,
--     'completed'
-- );
*/

-- ===================================
-- PERMISSIONS & SECURITY
-- ===================================
-- Grant appropriate permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO meetbrief_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO meetbrief_app;

-- Row Level Security (RLS) - Optional but recommended
-- ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sends ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only access their own data
-- CREATE POLICY transcripts_user_policy ON transcripts FOR ALL TO meetbrief_app USING (user_id = current_setting('app.current_user_id')::UUID);
-- CREATE POLICY summaries_user_policy ON summaries FOR ALL TO meetbrief_app USING (user_id = current_setting('app.current_user_id')::UUID);
-- CREATE POLICY sends_user_policy ON sends FOR ALL TO meetbrief_app USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===================================
-- VIEWS FOR COMMON QUERIES
-- ===================================
-- User dashboard summary view
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.clerk_user_id,
    COUNT(DISTINCT t.id) as total_transcripts,
    COUNT(DISTINCT s.id) as total_summaries,
    COUNT(DISTINCT se.id) as total_sends,
    COALESCE(SUM(t.word_count), 0) as total_words_processed,
    MAX(t.created_at) as last_transcript_upload,
    MAX(s.created_at) as last_summary_generated
FROM users u
LEFT JOIN transcripts t ON u.id = t.user_id AND t.status = 'completed'
LEFT JOIN summaries s ON u.id = s.user_id AND s.status = 'completed'  
LEFT JOIN sends se ON u.id = se.user_id AND se.status = 'sent'
GROUP BY u.id, u.clerk_user_id;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'transcript' as activity_type,
    t.id as item_id,
    t.title,
    t.user_id,
    t.created_at
FROM transcripts t
WHERE t.status = 'completed'
UNION ALL
SELECT 
    'summary' as activity_type,
    s.id as item_id,
    s.title,
    s.user_id,
    s.created_at
FROM summaries s
WHERE s.status = 'completed'
ORDER BY created_at DESC;

-- ===================================
-- COMPLETION MESSAGE
-- ===================================
-- Migration completed successfully!
-- Remember to:
-- 1. Update your DATABASE_URL in .env.local
-- 2. Run this migration in your Neon database
-- 3. Set up proper user permissions
-- 4. Configure Row Level Security if needed

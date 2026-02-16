
-- DISABLE ROW LEVEL SECURITY (RLS) to allow the app to read/write freely
-- This is recommended for this development phase.

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_keywords DISABLE ROW LEVEL SECURITY;

-- Verify schemas
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS meta_data JSONB;

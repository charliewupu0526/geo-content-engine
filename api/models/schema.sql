-- ================================================
-- GEO Content Engine - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Projects Table ====================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PROFILE_ENTRY',
    company_profile JSONB,
    wp_connection JSONB,
    social_connections JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

-- ==================== Crawl Results Table ====================
CREATE TABLE IF NOT EXISTS crawl_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_crawl_project ON crawl_results(project_id);
CREATE INDEX IF NOT EXISTS idx_crawl_url ON crawl_results(url);

-- ==================== Tasks Table ====================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    batch_id VARCHAR(100),
    branch VARCHAR(50) NOT NULL, -- 'Article' or 'Social'
    type VARCHAR(100),
    title TEXT NOT NULL,
    content TEXT,
    social_media_preview TEXT,
    gen_status VARCHAR(20) DEFAULT 'Pending', -- Pending, Success, Failed
    pub_status VARCHAR(20) DEFAULT 'Pending',
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_batch ON tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(gen_status, pub_status);

-- ==================== Gap Reports Table ====================
CREATE TABLE IF NOT EXISTS gap_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    summary TEXT,
    competitor_gaps JSONB,
    missing_keywords JSONB,
    structural_gaps JSONB,
    suggestions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gap_reports_project ON gap_reports(project_id);

-- ==================== Row Level Security (Optional) ====================
-- Enable RLS for all tables (if you want user-based access control)

-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gap_reports ENABLE ROW LEVEL SECURITY;

-- ==================== Helpful Views ====================
-- Project summary view
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.domain,
    p.status,
    p.created_at,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT cr.id) as crawl_count
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN crawl_results cr ON p.id = cr.project_id
GROUP BY p.id, p.name, p.domain, p.status, p.created_at;

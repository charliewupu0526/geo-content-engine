
-- Add user_id column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID;

-- Optional: Update RLS policies if we were using them
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "User can see their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "User can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
-- But for now we stick to manual filtering in code as we disabled RLS.

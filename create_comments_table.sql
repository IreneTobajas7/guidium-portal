-- Create task_comments table in the api schema
CREATE TABLE IF NOT EXISTS api.task_comments (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL,
    new_hire_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON api.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_new_hire_id ON api.task_comments(new_hire_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON api.task_comments(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE api.task_comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on task_comments" ON api.task_comments
    FOR ALL USING (true);

-- Add comment_count column to onboarding_plans table if it doesn't exist
ALTER TABLE api.onboarding_plans 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0; 
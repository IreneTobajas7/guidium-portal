-- Create feedback table in the api schema
CREATE TABLE IF NOT EXISTS api.onboarding_feedback (
    id SERIAL PRIMARY KEY,
    new_hire_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL, -- 'employee', 'manager', 'buddy'
    feedback_type TEXT NOT NULL, -- 'general', 'milestone', 'task', 'self_assessment'
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Optional rating 1-5
    milestone_id TEXT, -- Optional: if feedback is about a specific milestone
    task_id TEXT, -- Optional: if feedback is about a specific task
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_feedback_new_hire_id ON api.onboarding_feedback(new_hire_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_feedback_author_id ON api.onboarding_feedback(author_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_feedback_created_at ON api.onboarding_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_feedback_type ON api.onboarding_feedback(feedback_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE api.onboarding_feedback ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on onboarding_feedback" ON api.onboarding_feedback
    FOR ALL USING (true); 
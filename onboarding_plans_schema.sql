-- Onboarding Plans Schema for AI-Generated Plans
-- This table stores AI-generated onboarding plans for each new hire

-- Create onboarding_plans table
CREATE TABLE IF NOT EXISTS api.onboarding_plans (
    id SERIAL PRIMARY KEY,
    new_hire_id INTEGER REFERENCES api.new_hires(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, completed
    plan_data JSONB NOT NULL, -- Stores the complete plan structure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_plans_new_hire_id ON api.onboarding_plans(new_hire_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_plans_role ON api.onboarding_plans(role);

-- Enable RLS
ALTER TABLE api.onboarding_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Managers can view plans for their new hires" ON api.onboarding_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM api.new_hires nh
            JOIN api.managers m ON nh.manager_id = m.id
            WHERE nh.id = new_hire_id 
            AND m.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "New hires can view their own plans" ON api.onboarding_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM api.new_hires nh
            WHERE nh.id = new_hire_id 
            AND nh.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Managers can insert plans for their new hires" ON api.onboarding_plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM api.new_hires nh
            JOIN api.managers m ON nh.manager_id = m.id
            WHERE nh.id = new_hire_id 
            AND m.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Managers can update plans for their new hires" ON api.onboarding_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM api.new_hires nh
            JOIN api.managers m ON nh.manager_id = m.id
            WHERE nh.id = new_hire_id 
            AND m.email = auth.jwt() ->> 'email'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON api.onboarding_plans TO authenticated;
GRANT USAGE ON SEQUENCE api.onboarding_plans_id_seq TO authenticated;

-- Sample plan structure (for reference)
-- plan_data JSONB structure:
-- {
--   "milestones": [
--     {
--       "id": "day_1",
--       "label": "Day 1",
--       "color": "#2A9D8F",
--       "icon": "🚀",
--       "tasks": [
--         {
--           "id": 1,
--           "name": "Complete paperwork",
--           "description": "Fill out all required HR forms",
--           "due_date": "2024-01-15",
--           "status": "not_started",
--           "priority": "high",
--           "assignee": "new_hire",
--           "estimated_hours": 2,
--           "tags": ["HR", "Required"],
--           "resources": ["HR Portal", "Employee Handbook"],
--           "checklist": [
--             "Tax forms completed",
--             "Benefits enrollment",
--             "Emergency contacts added"
--           ]
--         }
--       ]
--     }
--   ],
--   "role_specific_tasks": [
--     {
--       "category": "Technical Skills",
--       "tasks": [...]
--     }
--   ],
--   "company_culture": [
--     {
--       "category": "Values & Mission",
--       "activities": [...]
--     }
--   ]
-- } 
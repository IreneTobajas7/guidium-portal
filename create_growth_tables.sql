-- Create growth_tests table
CREATE TABLE IF NOT EXISTS api.growth_tests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  duration_minutes INTEGER DEFAULT 15,
  questions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create growth_test_results table
CREATE TABLE IF NOT EXISTS api.growth_test_results (
  id SERIAL PRIMARY KEY,
  new_hire_id INTEGER NOT NULL REFERENCES api.new_hires(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES api.growth_tests(id) ON DELETE CASCADE,
  result_data JSONB,
  result_summary TEXT,
  insights TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create growth_insights table
CREATE TABLE IF NOT EXISTS api.growth_insights (
  id SERIAL PRIMARY KEY,
  new_hire_id INTEGER NOT NULL REFERENCES api.new_hires(id) ON DELETE CASCADE,
  insight_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.85,
  is_positive BOOLEAN DEFAULT true,
  actionable_items TEXT[],
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample growth tests
INSERT INTO api.growth_tests (name, description, category, duration_minutes, questions) VALUES
('Myers-Briggs Type Indicator', 'Discover your personality type and how it influences your work style', 'personality', 20, '{"questions": [{"id": 1, "question": "How do you prefer to spend your free time?", "options": [{"value": "E", "text": "With friends and family"}, {"value": "I", "text": "Alone or with a few close people"}]}, {"id": 2, "question": "When making decisions, you prefer to:", "options": [{"value": "T", "text": "Analyze facts and logic"}, {"value": "F", "text": "Consider feelings and values"}]}]}'),
('DISC Assessment', 'Understand your behavioral style and communication preferences', 'personality', 15, '{"questions": [{"id": 3, "question": "In a team setting, you typically:", "options": [{"value": "D", "text": "Take charge and direct others"}, {"value": "I", "text": "Motivate and inspire the team"}]}, {"id": 4, "question": "When faced with a challenge, you:", "options": [{"value": "S", "text": "Seek stability and consistency"}, {"value": "C", "text": "Analyze and research thoroughly"}]}]}'),
('Leadership Style Assessment', 'Identify your natural leadership approach and development areas', 'leadership', 25, '{"questions": [{"id": 5, "question": "As a leader, you prefer to:", "options": [{"value": "transformational", "text": "Inspire and motivate your team"}, {"value": "transactional", "text": "Set clear goals and reward achievement"}]}, {"id": 6, "question": "When delegating tasks, you:", "options": [{"value": "autocratic", "text": "Provide specific instructions"}, {"value": "democratic", "text": "Involve the team in decision-making"}]}]}'),
('Communication Style Test', 'Discover how you prefer to communicate and receive information', 'communication', 15, '{"questions": [{"id": 7, "question": "When presenting information, you prefer:", "options": [{"value": "visual", "text": "Charts, graphs, and visual aids"}, {"value": "verbal", "text": "Detailed explanations and discussions"}]}, {"id": 8, "question": "In meetings, you typically:", "options": [{"value": "active", "text": "Speak up and share your ideas"}, {"value": "reflective", "text": "Listen and process before responding"}]}]}'),
('Career Values Assessment', 'Identify what matters most to you in your career', 'career', 20, '{"questions": [{"id": 9, "question": "What motivates you most at work?", "options": [{"value": "achievement", "text": "Reaching goals and seeing results"}, {"value": "relationships", "text": "Building connections with colleagues"}]}, {"id": 10, "question": "In your ideal role, you would:", "options": [{"value": "autonomy", "text": "Have independence and control"}, {"value": "collaboration", "text": "Work closely with a team"}]}]}'),
('StrengthsFinder Assessment', 'Discover your top strengths and how to leverage them', 'strengths', 30, '{"questions": [{"id": 11, "question": "What comes naturally to you?", "options": [{"value": "analytical", "text": "Breaking down complex problems"}, {"value": "creative", "text": "Generating new ideas and solutions"}]}, {"id": 12, "question": "When you excel at something, it feels:", "options": [{"value": "energizing", "text": "Exciting and fulfilling"}, {"value": "effortless", "text": "Natural and easy"}]}]}')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE api.growth_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.growth_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.growth_insights ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all authenticated users to read growth_tests
CREATE POLICY "Allow read access to growth_tests" ON api.growth_tests
  FOR SELECT USING (true);

-- Create policies for growth_test_results - allow read/write for all authenticated users
-- (The application will handle authorization logic)
CREATE POLICY "Allow read access to growth_test_results" ON api.growth_test_results
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to growth_test_results" ON api.growth_test_results
  FOR INSERT WITH CHECK (true);

-- Create policies for growth_insights - allow read/write for all authenticated users
-- (The application will handle authorization logic)
CREATE POLICY "Allow read access to growth_insights" ON api.growth_insights
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to growth_insights" ON api.growth_insights
  FOR INSERT WITH CHECK (true); 
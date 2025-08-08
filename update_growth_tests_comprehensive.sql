-- Update growth tests with comprehensive questions
-- First, clear existing test data
DELETE FROM api.growth_test_results;
DELETE FROM api.growth_insights;
DELETE FROM api.growth_tests;

-- Insert comprehensive growth tests with many more questions
INSERT INTO api.growth_tests (name, description, category, duration_minutes, questions) VALUES
('Myers-Briggs Type Indicator', 'Discover your personality type and how it influences your work style', 'personality', 20, '{"questions": [
  {"id": 1, "question": "How do you prefer to spend your free time?", "options": [{"value": "E", "text": "With friends and family"}, {"value": "I", "text": "Alone or with a few close people"}]},
  {"id": 2, "question": "When making decisions, you prefer to:", "options": [{"value": "T", "text": "Analyze facts and logic"}, {"value": "F", "text": "Consider feelings and values"}]},
  {"id": 3, "question": "In social situations, you typically:", "options": [{"value": "E", "text": "Meet new people and enjoy being the center of attention"}, {"value": "I", "text": "Stick with familiar people and prefer smaller groups"}]},
  {"id": 4, "question": "When working on a project, you prefer:", "options": [{"value": "S", "text": "Clear, step-by-step instructions"}, {"value": "N", "text": "Flexibility to explore different approaches"}]},
  {"id": 5, "question": "You are more likely to:", "options": [{"value": "S", "text": "Focus on practical details and facts"}, {"value": "N", "text": "Look for patterns and possibilities"}]},
  {"id": 6, "question": "When solving problems, you rely more on:", "options": [{"value": "T", "text": "Objective analysis and logical thinking"}, {"value": "F", "text": "Personal values and how others might feel"}]},
  {"id": 7, "question": "You prefer work environments that are:", "options": [{"value": "J", "text": "Structured and organized with clear deadlines"}, {"value": "P", "text": "Flexible and adaptable to changing circumstances"}]},
  {"id": 8, "question": "When learning something new, you prefer:", "options": [{"value": "S", "text": "Concrete examples and practical applications"}, {"value": "N", "text": "Theoretical concepts and innovative approaches"}]},
  {"id": 9, "question": "In conflicts, you tend to:", "options": [{"value": "T", "text": "Focus on finding the most logical solution"}, {"value": "F", "text": "Consider everyone''s feelings and maintain harmony"}]},
  {"id": 10, "question": "You are energized by:", "options": [{"value": "E", "text": "Interacting with others and external activities"}, {"value": "I", "text": "Quiet reflection and internal processing"}]}
]}'),

('DISC Assessment', 'Understand your behavioral style and communication preferences', 'personality', 15, '{"questions": [
  {"id": 11, "question": "In a team setting, you typically:", "options": [{"value": "D", "text": "Take charge and direct others"}, {"value": "I", "text": "Motivate and inspire the team"}]},
  {"id": 12, "question": "When faced with a challenge, you:", "options": [{"value": "S", "text": "Seek stability and consistency"}, {"value": "C", "text": "Analyze and research thoroughly"}]},
  {"id": 13, "question": "In meetings, you prefer to:", "options": [{"value": "D", "text": "Get straight to the point and make decisions quickly"}, {"value": "I", "text": "Engage in lively discussion and build enthusiasm"}]},
  {"id": 14, "question": "When working with others, you value:", "options": [{"value": "S", "text": "Cooperation and team harmony"}, {"value": "C", "text": "Accuracy and attention to detail"}]},
  {"id": 15, "question": "Under pressure, you become:", "options": [{"value": "D", "text": "More direct and demanding"}, {"value": "I", "text": "More enthusiastic and persuasive"}]},
  {"id": 16, "question": "You prefer work that is:", "options": [{"value": "S", "text": "Consistent and predictable"}, {"value": "C", "text": "Precise and technically challenging"}]},
  {"id": 17, "question": "When communicating, you tend to:", "options": [{"value": "D", "text": "Be brief and results-oriented"}, {"value": "I", "text": "Be enthusiastic and people-focused"}]},
  {"id": 18, "question": "You are most comfortable with:", "options": [{"value": "S", "text": "Supporting others and maintaining relationships"}, {"value": "C", "text": "Ensuring quality and following procedures"}]},
  {"id": 19, "question": "When making decisions, you rely on:", "options": [{"value": "D", "text": "Quick assessment and action"}, {"value": "C", "text": "Careful analysis and evidence"}]},
  {"id": 20, "question": "You prefer environments that are:", "options": [{"value": "I", "text": "Dynamic and fast-paced"}, {"value": "S", "text": "Stable and supportive"}]}
]}'),

('Leadership Style Assessment', 'Identify your natural leadership approach and development areas', 'leadership', 25, '{"questions": [
  {"id": 21, "question": "As a leader, you prefer to:", "options": [{"value": "transformational", "text": "Inspire and motivate your team"}, {"value": "transactional", "text": "Set clear goals and reward achievement"}]},
  {"id": 22, "question": "When delegating tasks, you:", "options": [{"value": "autocratic", "text": "Provide specific instructions"}, {"value": "democratic", "text": "Involve the team in decision-making"}]},
  {"id": 23, "question": "In times of crisis, you tend to:", "options": [{"value": "autocratic", "text": "Take immediate control and make quick decisions"}, {"value": "democratic", "text": "Gather input from the team before acting"}]},
  {"id": 24, "question": "You believe the best way to motivate people is through:", "options": [{"value": "transformational", "text": "Inspiring vision and personal growth"}, {"value": "transactional", "text": "Clear expectations and fair rewards"}]},
  {"id": 25, "question": "When team members disagree, you:", "options": [{"value": "democratic", "text": "Facilitate discussion to find consensus"}, {"value": "autocratic", "text": "Make the final decision based on what''s best"}]},
  {"id": 26, "question": "You prefer to lead by:", "options": [{"value": "transformational", "text": "Setting an example and modeling desired behaviors"}, {"value": "transactional", "text": "Establishing clear systems and processes"}]},
  {"id": 27, "question": "When giving feedback, you focus on:", "options": [{"value": "transformational", "text": "Long-term development and potential"}, {"value": "transactional", "text": "Specific performance and measurable results"}]},
  {"id": 28, "question": "You believe change is best implemented through:", "options": [{"value": "transformational", "text": "Inspiring people to embrace new possibilities"}, {"value": "transactional", "text": "Clear communication of benefits and consequences"}]},
  {"id": 29, "question": "When building a team, you prioritize:", "options": [{"value": "democratic", "text": "Diverse perspectives and collaborative skills"}, {"value": "autocratic", "text": "Specific expertise and proven track records"}]},
  {"id": 30, "question": "You measure success primarily by:", "options": [{"value": "transformational", "text": "Team growth and innovation"}, {"value": "transactional", "text": "Efficiency and goal achievement"}]}
]}'),

('Communication Style Test', 'Discover how you prefer to communicate and receive information', 'communication', 15, '{"questions": [
  {"id": 31, "question": "When presenting information, you prefer:", "options": [{"value": "visual", "text": "Charts, graphs, and visual aids"}, {"value": "verbal", "text": "Detailed explanations and discussions"}]},
  {"id": 32, "question": "In meetings, you typically:", "options": [{"value": "active", "text": "Speak up and share your ideas"}, {"value": "reflective", "text": "Listen and process before responding"}]},
  {"id": 33, "question": "You prefer to receive feedback:", "options": [{"value": "direct", "text": "Immediately and straightforwardly"}, {"value": "constructive", "text": "With context and suggestions for improvement"}]},
  {"id": 34, "question": "When explaining complex topics, you:", "options": [{"value": "detailed", "text": "Provide comprehensive information and background"}, {"value": "concise", "text": "Focus on key points and practical applications"}]},
  {"id": 35, "question": "You prefer written communication that is:", "options": [{"value": "formal", "text": "Professional and structured"}, {"value": "casual", "text": "Conversational and approachable"}]},
  {"id": 36, "question": "When resolving conflicts, you prefer to:", "options": [{"value": "direct", "text": "Address issues immediately and openly"}, {"value": "mediated", "text": "Take time to understand all perspectives first"}]},
  {"id": 37, "question": "You learn best through:", "options": [{"value": "hands-on", "text": "Direct experience and practice"}, {"value": "theoretical", "text": "Reading and conceptual understanding"}]},
  {"id": 38, "question": "When giving instructions, you:", "options": [{"value": "step-by-step", "text": "Provide detailed, sequential guidance"}, {"value": "overview", "text": "Give the big picture and let people figure out details"}]},
  {"id": 39, "question": "You prefer team communication that is:", "options": [{"value": "frequent", "text": "Regular updates and check-ins"}, {"value": "as-needed", "text": "Only when there are important updates"}]},
  {"id": 40, "question": "When receiving criticism, you prefer:", "options": [{"value": "private", "text": "One-on-one conversations"}, {"value": "public", "text": "Open discussion in team settings"}]}
]}'),

('Career Values Assessment', 'Identify what matters most to you in your career', 'career', 20, '{"questions": [
  {"id": 41, "question": "What motivates you most at work?", "options": [{"value": "achievement", "text": "Reaching goals and seeing results"}, {"value": "relationships", "text": "Building connections with colleagues"}]},
  {"id": 42, "question": "In your ideal role, you would:", "options": [{"value": "autonomy", "text": "Have independence and control"}, {"value": "collaboration", "text": "Work closely with a team"}]},
  {"id": 43, "question": "You value work that:", "options": [{"value": "impact", "text": "Makes a difference in people''s lives"}, {"value": "innovation", "text": "Pushes boundaries and creates new solutions"}]},
  {"id": 44, "question": "Your ideal work environment is:", "options": [{"value": "stable", "text": "Predictable and secure"}, {"value": "dynamic", "text": "Fast-changing and exciting"}]},
  {"id": 45, "question": "You prefer recognition that is:", "options": [{"value": "public", "text": "Visible to others and celebrated"}, {"value": "private", "text": "Personal and meaningful"}]},
  {"id": 46, "question": "What matters most in your career growth?", "options": [{"value": "advancement", "text": "Moving up to higher positions"}, {"value": "expertise", "text": "Becoming a specialist in your field"}]},
  {"id": 47, "question": "You prefer work that is:", "options": [{"value": "structured", "text": "Well-defined with clear processes"}, {"value": "flexible", "text": "Adaptable to changing circumstances"}]},
  {"id": 48, "question": "Your ideal manager would:", "options": [{"value": "mentor", "text": "Guide your development and growth"}, {"value": "delegate", "text": "Give you autonomy and trust your judgment"}]},
  {"id": 49, "question": "You value compensation that is:", "options": [{"value": "competitive", "text": "Above market rates"}, {"value": "equitable", "text": "Fair and transparent"}]},
  {"id": 50, "question": "What drives your career decisions?", "options": [{"value": "purpose", "text": "Alignment with your values and beliefs"}, {"value": "opportunity", "text": "Potential for growth and advancement"}]}
]}'),

('StrengthsFinder Assessment', 'Discover your top strengths and how to leverage them', 'strengths', 30, '{"questions": [
  {"id": 51, "question": "What comes naturally to you?", "options": [{"value": "analytical", "text": "Breaking down complex problems"}, {"value": "creative", "text": "Generating new ideas and solutions"}]},
  {"id": 52, "question": "When you excel at something, it feels:", "options": [{"value": "energizing", "text": "Exciting and fulfilling"}, {"value": "effortless", "text": "Natural and easy"}]},
  {"id": 53, "question": "Others often come to you for:", "options": [{"value": "strategic", "text": "Big-picture thinking and planning"}, {"value": "execution", "text": "Getting things done efficiently"}]},
  {"id": 54, "question": "You naturally notice:", "options": [{"value": "patterns", "text": "Connections and trends"}, {"value": "details", "text": "Specific facts and accuracy"}]},
  {"id": 55, "question": "When working with others, you tend to:", "options": [{"value": "harmonize", "text": "Bring people together and resolve conflicts"}, {"value": "activate", "text": "Motivate and energize the team"}]},
  {"id": 56, "question": "You are most confident when:", "options": [{"value": "learning", "text": "Acquiring new knowledge and skills"}, {"value": "teaching", "text": "Sharing your expertise with others"}]},
  {"id": 57, "question": "You prefer challenges that are:", "options": [{"value": "intellectual", "text": "Complex and thought-provoking"}, {"value": "practical", "text": "Hands-on and results-oriented"}]},
  {"id": 58, "question": "When making decisions, you rely on:", "options": [{"value": "intuition", "text": "Your gut feeling and instincts"}, {"value": "data", "text": "Facts, figures, and evidence"}]},
  {"id": 59, "question": "You are energized by:", "options": [{"value": "variety", "text": "Different tasks and new experiences"}, {"value": "mastery", "text": "Perfecting skills and deepening expertise"}]},
  {"id": 60, "question": "Your natural approach to problems is:", "options": [{"value": "systematic", "text": "Step-by-step analysis and planning"}, {"value": "innovative", "text": "Creative thinking and unconventional solutions"}]}
]}')
ON CONFLICT (name) DO NOTHING; 
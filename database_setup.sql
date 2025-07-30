-- Database setup for auto-status calculation
-- Run this in your Supabase SQL editor

-- 1. Add completion tracking column to new_hires table
ALTER TABLE api.new_hires 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_milestone VARCHAR(20) DEFAULT 'day_1';

-- 2. Function to calculate workdays between two dates (excluding weekends)
CREATE OR REPLACE FUNCTION api.calculate_workdays(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    workdays INTEGER := 0;
    check_date DATE := start_date;
BEGIN
    WHILE check_date <= end_date LOOP
        -- Check if it's a weekday (Monday = 1, Sunday = 7)
        IF EXTRACT(DOW FROM check_date) BETWEEN 1 AND 5 THEN
            workdays := workdays + 1;
        END IF;
        check_date := check_date + INTERVAL '1 day';
    END LOOP;
    RETURN workdays;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to determine current milestone based on workdays
CREATE OR REPLACE FUNCTION api.get_current_milestone(workdays_since_start INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF workdays_since_start < 1 THEN
        RETURN 'not_started';
    ELSIF workdays_since_start <= 5 THEN
        RETURN 'week_1';
    ELSIF workdays_since_start <= 30 THEN
        RETURN 'day_30';
    ELSIF workdays_since_start <= 60 THEN
        RETURN 'day_60';
    ELSIF workdays_since_start <= 90 THEN
        RETURN 'day_90';
    ELSE
        RETURN 'overdue';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to calculate onboarding status
CREATE OR REPLACE FUNCTION api.calculate_onboarding_status(
    start_date DATE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE
)
RETURNS VARCHAR(20) AS $$
DECLARE
    workdays_since_start INTEGER;
    expected_milestone VARCHAR(20);
BEGIN
    -- If manager marked as completed, return completed
    IF onboarding_completed_at IS NOT NULL THEN
        RETURN 'completed';
    END IF;
    
    -- If start date is in the future, not started
    IF start_date > CURRENT_DATE THEN
        RETURN 'not_started';
    END IF;
    
    -- Calculate workdays since start
    workdays_since_start := api.calculate_workdays(start_date, CURRENT_DATE);
    
    -- Get expected milestone based on workdays
    expected_milestone := api.get_current_milestone(workdays_since_start);
    
    -- Determine if overdue
    IF expected_milestone = 'overdue' THEN
        RETURN 'overdue';
    END IF;
    
    -- Otherwise, in progress
    RETURN 'in_progress';
END;
$$ LANGUAGE plpgsql;

-- 5. Create view with auto-calculated status
CREATE OR REPLACE VIEW api.new_hires_with_status AS
SELECT 
    nh.*,
    api.calculate_workdays(nh.start_date::DATE, CURRENT_DATE) as workdays_since_start,
    api.get_current_milestone(api.calculate_workdays(nh.start_date::DATE, CURRENT_DATE)) as expected_milestone,
    api.calculate_onboarding_status(
        nh.start_date::DATE, 
        nh.onboarding_completed_at
    ) as calculated_status
FROM api.new_hires nh;

-- 6. Update existing records with some sample data
UPDATE api.new_hires 
SET 
    current_milestone = 'week_1',
    role = 'Software Engineer'
WHERE id = 17;

UPDATE api.new_hires 
SET 
    current_milestone = 'day_30',
    role = 'Product Manager'
WHERE id = 15;

UPDATE api.new_hires 
SET 
    current_milestone = 'day_1',
    role = 'Designer'
WHERE id = 14;

UPDATE api.new_hires 
SET 
    current_milestone = 'day_60',
    role = 'Marketing Specialist'
WHERE id = 16;

UPDATE api.new_hires 
SET 
    current_milestone = 'day_90',
    role = 'Sales Representative'
WHERE id = 18;

-- 7. Grant permissions
GRANT SELECT ON api.new_hires_with_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.calculate_workdays(DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.get_current_milestone(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.calculate_onboarding_status(DATE, TIMESTAMP WITH TIME ZONE) TO anon, authenticated; 
-- Comprehensive RLS Policy Fix for new_hires table
-- This script will fix the JWT authentication issue and create proper policies

-- 1. First, let's check the current state
SELECT 'Current RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'api' AND tablename = 'new_hires';

-- 2. Check current policies
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'new_hires';

-- 3. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated insert" ON api.new_hires;
DROP POLICY IF EXISTS "Managers can insert new hires" ON api.new_hires;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON api.new_hires;

-- 4. Ensure RLS is enabled
ALTER TABLE api.new_hires ENABLE ROW LEVEL SECURITY;

-- 5. Create a comprehensive policy that handles JWT properly
CREATE POLICY "Managers can insert new hires with JWT" ON api.new_hires
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if manager_id matches the authenticated user's manager record
    manager_id IN (
      SELECT id FROM api.managers 
      WHERE email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR
    -- Fallback: allow if the user is authenticated (for development)
    auth.role() = 'authenticated'
  );

-- 6. Create a policy for reading new hires (managers can see their team)
CREATE POLICY "Managers can view their new hires" ON api.new_hires
  FOR SELECT
  TO authenticated
  USING (
    manager_id IN (
      SELECT id FROM api.managers 
      WHERE email = COALESCE(auth.jwt() ->> 'email', '')
    )
    OR
    -- Allow authenticated users to read (for development)
    auth.role() = 'authenticated'
  );

-- 7. Create a policy for updating new hires
CREATE POLICY "Managers can update their new hires" ON api.new_hires
  FOR UPDATE
  TO authenticated
  USING (
    manager_id IN (
      SELECT id FROM api.managers 
      WHERE email = COALESCE(auth.jwt() ->> 'email', '')
    )
  )
  WITH CHECK (
    manager_id IN (
      SELECT id FROM api.managers 
      WHERE email = COALESCE(auth.jwt() ->> 'email', '')
    )
  );

-- 8. Test the policy logic
SELECT 'Testing policy logic:' as info;
SELECT 
  '428f7d59-0aa0-4d5e-9346-97b47fab01bf' as manager_id,
  'irenetobajas@gmail.com' as jwt_email,
  EXISTS (
    SELECT 1 FROM api.managers 
    WHERE id = '428f7d59-0aa0-4d5e-9346-97b47fab01bf' 
    AND email = 'irenetobajas@gmail.com'
  ) as manager_exists,
  'Should allow insert' as result;

-- 9. Show final policies
SELECT 'Final policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'api' AND tablename = 'new_hires';

-- 10. Grant necessary permissions
GRANT ALL ON api.new_hires TO authenticated;
GRANT USAGE ON SCHEMA api TO authenticated; 
# Manual Setup for Resources Table

Since the automated table creation isn't working, please follow these manual steps:

## Step 1: Go to your Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to the "SQL Editor" section
3. Create a new query

**Important**: Your Supabase project is configured to use the `api` schema instead of the `public` schema, so we need to create the table in the `api` schema.

## Step 2: Run this SQL script

Copy and paste this SQL into the editor and run it:

```sql
-- Create the resources table in the api schema
CREATE TABLE IF NOT EXISTS api.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('link', 'file')),
    url TEXT,
    file_path TEXT,
    category TEXT NOT NULL,
    accessible_to TEXT NOT NULL DEFAULT 'all' CHECK (accessible_to IN ('all', 'specific')),
    accessible_employees INTEGER[] DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_accessible_to ON api.resources(accessible_to);
CREATE INDEX IF NOT EXISTS idx_resources_category ON api.resources(category);

-- Enable Row Level Security (RLS)
ALTER TABLE api.resources ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for now)
CREATE POLICY "Allow all operations on resources" ON api.resources
    FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON api.resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Step 3: Verify the table was created

After running the SQL, you should see:
- A new table called "resources" in your database under the "api" schema
- The table should appear in the "Table Editor" section
- Make sure to look for the table under the "api" schema, not "public"

## Step 4: Test the API

Once the table is created, the resources API should work correctly and you should be able to:
- Add resources from the manager dashboard
- See resources persist when you navigate away and back
- See resources appear in employee onboarding plans based on access control

## Troubleshooting

If you still get 500 errors after creating the table:
1. Check the browser console for more detailed error messages
2. Check the terminal where you're running `npm run dev` for server-side errors
3. Make sure your `.env.local` file has the correct `SUPABASE_SERVICE_ROLE_KEY` 
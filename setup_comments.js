const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupCommentsTable() {
  try {
    console.log('Setting up comments table...');

    // Create comments table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS task_comments (
          id SERIAL PRIMARY KEY,
          task_id VARCHAR(255) NOT NULL,
          new_hire_id INTEGER NOT NULL,
          author_name VARCHAR(255) NOT NULL,
          author_email VARCHAR(255) NOT NULL,
          comment_text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.error('Error creating table:', createTableError);
      return;
    }

    // Create indexes
    const { error: index1Error } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);`
    });

    const { error: index2Error } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_task_comments_new_hire_id ON task_comments(new_hire_id);`
    });

    if (index1Error) console.error('Error creating index 1:', index1Error);
    if (index2Error) console.error('Error creating index 2:', index2Error);

    // Add comment_count column to onboarding_plans if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_plans' AND column_name = 'comment_count') THEN
            ALTER TABLE onboarding_plans ADD COLUMN comment_count INTEGER DEFAULT 0;
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.error('Error adding comment_count column:', alterError);
    }

    console.log('Comments table setup completed successfully!');
  } catch (error) {
    console.error('Error setting up comments table:', error);
  }
}

setupCommentsTable(); 
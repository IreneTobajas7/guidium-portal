-- Fix buddy_id to be nullable in new_hires table
-- Run this in your Supabase SQL editor

-- Make buddy_id nullable if it isn't already
ALTER TABLE api.new_hires 
ALTER COLUMN buddy_id DROP NOT NULL;

-- Add a comment to clarify it's optional
COMMENT ON COLUMN api.new_hires.buddy_id IS 'Optional buddy assignment for new hires'; 
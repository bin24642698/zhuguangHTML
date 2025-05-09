-- Supabase Migration: Create user_tishici_selections table and related objects
-- Version: 1.0
-- Description: Sets up the schema for storing user selections of public prompts.

-- Section 1: Tables
-- -------------------
-- Creates the table to store user selections of public prompts.
CREATE TABLE public.user_tishici_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),       -- Unique identifier for each selection
  user_id UUID NOT NULL,                               -- User who selected the prompt, references auth.users.id
  tishici_id UUID NOT NULL,                            -- Selected prompt, references tishici.id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- Creation timestamp

  CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,  -- If a user is deleted, their selections are also deleted

  CONSTRAINT fk_tishici
    FOREIGN KEY(tishici_id)
    REFERENCES public.tishici(id)
    ON DELETE CASCADE,  -- If a prompt is deleted, selections of it are also deleted

  -- Ensure a user can only select a prompt once
  CONSTRAINT unique_user_tishici UNIQUE(user_id, tishici_id)
);

COMMENT ON TABLE public.user_tishici_selections IS 'Stores user selections of public prompts for use in their interfaces.';
COMMENT ON COLUMN public.user_tishici_selections.id IS 'Primary key, unique identifier for each selection.';
COMMENT ON COLUMN public.user_tishici_selections.user_id IS 'References the ID from the auth.users table. Identifies the user who selected the prompt.';
COMMENT ON COLUMN public.user_tishici_selections.tishici_id IS 'References the ID from the tishici table. Identifies the selected prompt.';
COMMENT ON COLUMN public.user_tishici_selections.created_at IS 'Timestamp indicating when this selection was created.';

-- Section 2: Indexes
-- --------------------
-- Index on user_id to optimize queries filtering by user
CREATE INDEX IF NOT EXISTS idx_user_tishici_selections_user_id ON public.user_tishici_selections(user_id);
COMMENT ON INDEX public.idx_user_tishici_selections_user_id IS 'Improves performance of queries that filter by user_id.';

-- Index on tishici_id to optimize queries filtering by prompt
CREATE INDEX IF NOT EXISTS idx_user_tishici_selections_tishici_id ON public.user_tishici_selections(tishici_id);
COMMENT ON INDEX public.idx_user_tishici_selections_tishici_id IS 'Improves performance of queries that filter by tishici_id.';

-- Section 3: Row Level Security (RLS)
-- -------------------------------------
-- Enable Row Level Security on the 'user_tishici_selections' table
ALTER TABLE public.user_tishici_selections ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own selections
CREATE POLICY "Users can view their own selections"
ON public.user_tishici_selections
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can view their own selections" ON public.user_tishici_selections IS 
'Allows authenticated users to view only their own prompt selections.';

-- Policy: Allow users to insert their own selections
CREATE POLICY "Users can create their own selections"
ON public.user_tishici_selections
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can create their own selections" ON public.user_tishici_selections IS 
'Allows authenticated users to create new selections with their user_id.';

-- Policy: Allow users to delete their own selections
CREATE POLICY "Users can delete their own selections"
ON public.user_tishici_selections
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can delete their own selections" ON public.user_tishici_selections IS 
'Allows authenticated users to delete only their own selections.';

-- End of migration script

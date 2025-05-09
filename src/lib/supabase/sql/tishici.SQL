-- Supabase Migration: Create tishici table and related objects
-- Version: 1.0
-- Description: Sets up the schema for storing and managing prompt words with public/private access control.

-- Section 1: Tables
-- -------------------
-- Creates the main table to store prompt words (tishici).
CREATE TABLE public.tishici (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),       -- Unique identifier for each prompt
  user_id UUID NOT NULL,                               -- Creator of the prompt, references auth.users.id
  title TEXT NOT NULL,                                 -- Title of the prompt
  content TEXT NOT NULL,                               -- Content of the prompt
  is_public BOOLEAN NOT NULL DEFAULT false,            -- Whether the prompt is public or private
  public_changed_at TIMESTAMPTZ DEFAULT NOW(),         -- Last time the public status was changed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- Creation timestamp
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- Last update timestamp

  CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE  -- If a user is deleted, their prompts are also deleted
);

COMMENT ON TABLE public.tishici IS 'Stores user-created prompts with public/private access control.';
COMMENT ON COLUMN public.tishici.id IS 'Primary key, unique identifier for each prompt.';
COMMENT ON COLUMN public.tishici.user_id IS 'References the ID from the auth.users table. Identifies the creator of the prompt.';
COMMENT ON COLUMN public.tishici.title IS 'The title of the prompt.';
COMMENT ON COLUMN public.tishici.content IS 'The actual content of the prompt.';
COMMENT ON COLUMN public.tishici.is_public IS 'Indicates whether the prompt is publicly accessible. Default is private (false).';
COMMENT ON COLUMN public.tishici.public_changed_at IS 'Timestamp of when the public status was last changed. Used to enforce the 3-day change restriction.';
COMMENT ON COLUMN public.tishici.created_at IS 'Timestamp indicating when this prompt was created.';
COMMENT ON COLUMN public.tishici.updated_at IS 'Timestamp indicating when this prompt was last updated.';


-- Section 2: Triggers and Functions
-- -----------------------------------
-- Reuse the existing trigger_set_timestamp function from huiyuan.SQL

-- Trigger to update the 'updated_at' timestamp on row modification.
CREATE TRIGGER set_tishici_updated_at
BEFORE UPDATE ON public.tishici
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

COMMENT ON TRIGGER set_tishici_updated_at ON public.tishici IS 'Ensures the updated_at field is automatically current on every update to a tishici record.';

-- Function to check if public status can be changed (3-day restriction)
CREATE OR REPLACE FUNCTION public.check_public_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if is_public is being changed
  IF OLD.is_public IS DISTINCT FROM NEW.is_public THEN
    -- Check if it's been at least 3 days since the last change
    IF OLD.public_changed_at + INTERVAL '3 days' > NOW() THEN
      RAISE EXCEPTION 'Public status can only be changed once every 3 days. Next change allowed after %', OLD.public_changed_at + INTERVAL '3 days';
    END IF;
    -- Update the public_changed_at timestamp
    NEW.public_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_public_status_change() IS 'Enforces the rule that public status can only be changed once every 3 days.';

-- Trigger to check public status change restriction
CREATE TRIGGER check_tishici_public_status_change
BEFORE UPDATE OF is_public ON public.tishici
FOR EACH ROW
EXECUTE FUNCTION public.check_public_status_change();

COMMENT ON TRIGGER check_tishici_public_status_change ON public.tishici IS 'Enforces the 3-day restriction on changing the public status of a prompt.';


-- Section 3: Indexes
-- --------------------
-- Index on user_id to optimize queries filtering by user
CREATE INDEX IF NOT EXISTS idx_tishici_user_id ON public.tishici(user_id);
COMMENT ON INDEX public.idx_tishici_user_id IS 'Improves performance of queries that filter by user_id.';

-- Index on is_public to optimize queries for public prompts
CREATE INDEX IF NOT EXISTS idx_tishici_is_public ON public.tishici(is_public);
COMMENT ON INDEX public.idx_tishici_is_public IS 'Improves performance of queries that filter by public status.';


-- Section 4: Row Level Security (RLS)
-- -------------------------------------
-- Enable Row Level Security on the 'tishici' table
ALTER TABLE public.tishici ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own prompts and all public prompts
CREATE POLICY "Users can view their own prompts and public prompts"
ON public.tishici
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR is_public = true
);

COMMENT ON POLICY "Users can view their own prompts and public prompts" ON public.tishici IS 
'Allows authenticated users to view their own prompts and any prompts marked as public.';

-- Policy: Allow users to insert their own prompts
CREATE POLICY "Users can create their own prompts"
ON public.tishici
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can create their own prompts" ON public.tishici IS 
'Allows authenticated users to create new prompts with their user_id.';

-- Policy: Allow users to update their own prompts
CREATE POLICY "Users can update their own prompts"
ON public.tishici
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can update their own prompts" ON public.tishici IS 
'Allows authenticated users to update only their own prompts.';

-- Policy: Allow users to delete their own prompts
CREATE POLICY "Users can delete their own prompts"
ON public.tishici
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);

COMMENT ON POLICY "Users can delete their own prompts" ON public.tishici IS 
'Allows authenticated users to delete only their own prompts.';

-- End of migration script

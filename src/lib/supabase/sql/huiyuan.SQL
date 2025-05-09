
-- Supabase Migration: Create huiyuan table and related objects
-- Version: 1.0
-- Description: Sets up the initial schema for user membership, quotas, and access policies.

-- Section 1: Custom Types
-- -------------------------
-- Defines a custom enumeration type for membership levels.
CREATE TYPE public.member_level AS ENUM (
  'free',       -- Basic free tier
  'standard',   -- Standard paid tier
  'premium',    -- Premium paid tier
  'black_gold'  -- Highest exclusive tier
);

COMMENT ON TYPE public.member_level IS 'Enumeration of available membership levels for users.';


-- Section 2: Tables
-- -------------------
-- Creates the main table to store user membership information.
CREATE TABLE public.huiyuan (
  id UUID PRIMARY KEY NOT NULL,                     -- User ID, references auth.users.id
  level public.member_level NOT NULL DEFAULT 'free',  -- Membership level, defaults to 'free'
  monthly_quota BIGINT NOT NULL DEFAULT 0,          -- Total monthly usage quota (e.g., words, API calls)
  daily_usage_limit INT NOT NULL DEFAULT 0,         -- Max daily AI function calls
  remaining_monthly_quota BIGINT NOT NULL DEFAULT 0,  -- Remaining monthly quota for the current cycle
  remaining_daily_usage INT NOT NULL DEFAULT 0,     -- Remaining daily AI calls for the current day
  quota_refresh_time TIMESTAMPTZ,                   -- Timestamp for the next monthly quota refresh
  daily_usage_reset_time TIMESTAMPTZ,                -- Timestamp for the next daily usage limit reset (e.g., 1:00 AM daily)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- Timestamp of record creation
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- Timestamp of last record update

  CONSTRAINT fk_user
    FOREIGN KEY(id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,  -- If a user is deleted from auth.users, their huiyuan record is also deleted.

  CONSTRAINT check_monthly_quota_non_negative CHECK (monthly_quota >= 0),
  CONSTRAINT check_daily_limit_non_negative CHECK (daily_usage_limit >= 0),
  CONSTRAINT check_remaining_monthly_quota_non_negative CHECK (remaining_monthly_quota >= 0),
  CONSTRAINT check_remaining_daily_usage_non_negative CHECK (remaining_daily_usage >= 0)
);

COMMENT ON TABLE public.huiyuan IS 'Stores user-specific membership details, usage quotas, and refresh cycle information.';
COMMENT ON COLUMN public.huiyuan.id IS 'Primary key, references the ID from the auth.users table. Ensures referential integrity and cascading deletes.';
COMMENT ON COLUMN public.huiyuan.level IS 'The current membership level of the user. Defaults to ''free''.';
COMMENT ON COLUMN public.huiyuan.monthly_quota IS 'The total usage quota allocated to the user per month based on their level.';
COMMENT ON COLUMN public.huiyuan.daily_usage_limit IS 'The maximum number of times the user can utilize AI features per day.';
COMMENT ON COLUMN public.huiyuan.remaining_monthly_quota IS 'Tracks the user''s remaining monthly usage quota. Deducted upon use, reset monthly.';
COMMENT ON COLUMN public.huiyuan.remaining_daily_usage IS 'Tracks the user''s remaining daily AI feature calls. Deducted upon use, reset daily.';
COMMENT ON COLUMN public.huiyuan.quota_refresh_time IS 'The specific date and time when the monthly_quota and remaining_monthly_quota will be reset.';
COMMENT ON COLUMN public.huiyuan.daily_usage_reset_time IS 'The specific date and time (typically daily at 1:00 AM) when the daily_usage_limit and remaining_daily_usage will be reset.';
COMMENT ON COLUMN public.huiyuan.created_at IS 'Timestamp indicating when this membership record was initially created.';
COMMENT ON COLUMN public.huiyuan.updated_at IS 'Timestamp indicating the last time this membership record was modified. Automatically updated by a trigger.';


-- Section 3: Triggers and Functions
-- -----------------------------------
-- Function to automatically update the 'updated_at' timestamp on row modification.
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trigger_set_timestamp() IS 'A trigger function that sets the updated_at column to the current timestamp whenever a row is updated.';

-- Trigger to call the timestamp update function before any update on the 'huiyuan' table.
CREATE TRIGGER set_huiyuan_updated_at
BEFORE UPDATE ON public.huiyuan
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

COMMENT ON TRIGGER set_huiyuan_updated_at ON public.huiyuan IS 'Ensures the updated_at field is automatically current on every update to a huiyuan record.';


-- Section 4: Indexes
-- --------------------
-- Index on the 'level' column to optimize queries filtering by membership level.
CREATE INDEX IF NOT EXISTS idx_huiyuan_level ON public.huiyuan(level);

COMMENT ON INDEX public.idx_huiyuan_level IS 'Improves performance of queries that filter or sort by the membership level.';


-- Section 5: Row Level Security (RLS)
-- -------------------------------------
-- Enable Row Level Security on the 'huiyuan' table.
ALTER TABLE public.huiyuan ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own membership data.
-- This policy restricts users to only see their own record in the huiyuan table.
-- Write operations (INSERT, UPDATE, DELETE) from the client-side by authenticated users are implicitly denied
-- as no specific policies grant such permissions. These operations should be handled by backend services
-- using the service_role key or appropriate SECURITY DEFINER functions.
CREATE POLICY "Users can view their own huiyuan data"
ON public.huiyuan
FOR SELECT
TO authenticated -- Explicitly grants select to 'authenticated' role
USING (auth.uid() = id);

COMMENT ON POLICY "Users can view their own huiyuan data" ON public.huiyuan IS 'Enforces that authenticated users can only select (read) their own membership data. Direct client-side write access is denied by default and should be managed via trusted backend processes.';

-- End of migration script

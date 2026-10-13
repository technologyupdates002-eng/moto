/*
# Create AI Assistant conversation tables

1. New Tables
- `ai_assistant_conversations` — Stores per-user AI chat sessions.
  - `id` (uuid, primary key)
  - `user_id` (text, not null) — references the app's user ID (not auth.users since this app uses custom auth)
  - `user_role` (text, not null) — the user's role at time of conversation (admin, secretary, etc.)
  - `context_type` (text, not null default 'admin_assistant') — either 'admin_assistant' or 'secretary_assistant'
  - `title` (text) — auto-generated or user-set conversation title
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `ai_assistant_messages` — Stores individual messages within a conversation.
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, foreign key to ai_assistant_conversations, ON DELETE CASCADE)
  - `role` (text, not null) — 'user' or 'assistant'
  - `content` (text, not null) — the message content
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- The app uses custom JWT auth (not Supabase auth), so the edge function will use the service role key
  to insert/select on behalf of the authenticated user. RLS policies are set to authenticated-only
  as a defense-in-depth measure, but the edge function is the primary access control layer.
- Indexes on conversation_id and user_id for query performance.
*/

CREATE TABLE IF NOT EXISTS ai_assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_role text NOT NULL,
  context_type text NOT NULL DEFAULT 'admin_assistant',
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_assistant_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_messages_conversation_id
  ON ai_assistant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_conversations_user_id
  ON ai_assistant_conversations(user_id);

ALTER TABLE ai_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assistant_messages ENABLE ROW LEVEL SECURITY;

-- The edge function uses the service role key which bypasses RLS.
-- These policies are defense-in-depth for any direct client access.
DROP POLICY IF EXISTS "authenticated_read_conversations" ON ai_assistant_conversations;
CREATE POLICY "authenticated_read_conversations"
  ON ai_assistant_conversations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_messages" ON ai_assistant_messages;
CREATE POLICY "authenticated_read_messages"
  ON ai_assistant_messages FOR SELECT
  TO authenticated USING (true);

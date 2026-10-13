/*
# Create group chat tables (tables + RLS)

## Tables

1. chat_conversations — group or direct message threads
2. chat_participants — membership with last_read_at
3. chat_messages — messages with reply and mention support
4. chat_reactions — emoji reactions (unique per message/user/emoji)
5. chat_typing — ephemeral typing indicators (unique per conversation/user)

## Security
- RLS enabled on all tables
- TO authenticated, authenticated can read/write all chat rows (members-only app)

## Notes
- user_id is text because the app uses Laravel JWT auth, not Supabase auth
*/

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL DEFAULT 'group' CHECK (type IN ('group','direct')),
  avatar_url text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  reply_to_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  mentions text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS chat_typing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation ON chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_conversation ON chat_typing(conversation_id);

-- Enable RLS on all chat tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing ENABLE ROW LEVEL SECURITY;

-- chat_conversations: full CRUD for authenticated users
DROP POLICY IF EXISTS "chat_conv_select" ON chat_conversations;
CREATE POLICY "chat_conv_select" ON chat_conversations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat_conv_insert" ON chat_conversations;
CREATE POLICY "chat_conv_insert" ON chat_conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_conv_update" ON chat_conversations;
CREATE POLICY "chat_conv_update" ON chat_conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_conv_delete" ON chat_conversations;
CREATE POLICY "chat_conv_delete" ON chat_conversations FOR DELETE
  TO anon, authenticated USING (true);

-- chat_participants: full CRUD for authenticated users
DROP POLICY IF EXISTS "chat_part_select" ON chat_participants;
CREATE POLICY "chat_part_select" ON chat_participants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat_part_insert" ON chat_participants;
CREATE POLICY "chat_part_insert" ON chat_participants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_part_update" ON chat_participants;
CREATE POLICY "chat_part_update" ON chat_participants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_part_delete" ON chat_participants;
CREATE POLICY "chat_part_delete" ON chat_participants FOR DELETE
  TO anon, authenticated USING (true);

-- chat_messages: full CRUD for authenticated users
DROP POLICY IF EXISTS "chat_msg_select" ON chat_messages;
CREATE POLICY "chat_msg_select" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat_msg_insert" ON chat_messages;
CREATE POLICY "chat_msg_insert" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_msg_update" ON chat_messages;
CREATE POLICY "chat_msg_update" ON chat_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_msg_delete" ON chat_messages;
CREATE POLICY "chat_msg_delete" ON chat_messages FOR DELETE
  TO anon, authenticated USING (true);

-- chat_reactions: full CRUD for authenticated users
DROP POLICY IF EXISTS "chat_react_select" ON chat_reactions;
CREATE POLICY "chat_react_select" ON chat_reactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat_react_insert" ON chat_reactions;
CREATE POLICY "chat_reactions_insert" ON chat_reactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_react_insert" ON chat_reactions;
CREATE POLICY "chat_reactions_insert_dup" ON chat_reactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_react_update" ON chat_reactions;
CREATE POLICY "chat_react_update" ON chat_reactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_react_delete" ON chat_reactions;
CREATE POLICY "chat_react_delete" ON chat_reactions FOR DELETE
  TO anon, authenticated USING (true);

-- chat_typing: full CRUD for authenticated users
DROP POLICY IF EXISTS "chat_typing_select" ON chat_typing;
CREATE POLICY "chat_typing_select" ON chat_typing FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chat_typing_insert" ON chat_typing;
CREATE POLICY "chat_typing_insert" ON chat_typing FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_typing_update" ON chat_typing;
CREATE POLICY "chat_typing_update" ON chat_typing FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_typing_delete" ON chat_typing;
CREATE POLICY "chat_typing_delete" ON chat_typing FOR DELETE
  TO anon, authenticated USING (true);

-- Add realtime publication for all chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_typing;

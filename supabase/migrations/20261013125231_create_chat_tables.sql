/*
# Create group chat tables

## Summary
Creates tables for WhatsApp-style group chat between KHWWC members:
- chat_conversations: group or direct message threads
- chat_participants: who belongs to each conversation (with last_read_at)
- chat_messages: individual messages with optional reply/mention support
- chat_reactions: emoji reactions on messages
- chat_typing: ephemeral typing indicator rows

## Tables

1. chat_conversations
   - id (uuid PK)
   - name (text) - group name, nullable for DMs
   - type (text) - 'group' or 'direct'
   - avatar_url (text) - optional group avatar
   - created_by (text) - user id of creator
   - created_at (timestamptz)
   - updated_at (timestamptz) - bumped on new message for sorting

2. chat_participants
   - id (uuid PK)
   - conversation_id (uuid FK -> chat_conversations)
   - user_id (text) - the auth user id
   - user_name (text) - denormalized for display
   - user_avatar (text) - optional
   - role (text) - 'admin' or 'member' within the conversation
   - last_read_at (timestamptz) - for unread badge calculation
   - joined_at (timestamptz)

3. chat_messages
   - id (uuid PK)
   - conversation_id (uuid FK -> chat_conversations)
   - user_id (text) - sender user id
   - user_name (text) - sender display name (denormalized)
   - user_avatar (text) - optional
   - content (text) - message body
   - reply_to_id (uuid) - optional reference to another message
   - mentions (text[]) - array of user ids mentioned
   - created_at (timestamptz)

4. chat_reactions
   - id (uuid PK)
   - message_id (uuid FK -> chat_messages)
   - user_id (text)
   - emoji (text) - the emoji character
   - created_at (timestamptz)
   - Unique constraint on (message_id, user_id, emoji)

5. chat_typing
   - id (uuid PK)
   - conversation_id (uuid FK -> chat_conversations)
   - user_id (text)
   - user_name (text)
   - updated_at (timestamptz) - continuously updated while typing
   - Unique on (conversation_id, user_id) so each user has one typing row

## Security
- RLS enabled on all tables
- Policies allow any authenticated user to read/write chat data (members-only app)
- All operations scoped to TO authenticated

## Notes
- user_id is text (not uuid) because the app uses its own JWT-based auth, not Supabase auth
- The frontend sends the JWT from the Laravel API; Supabase anon key is used for the client
- For demo mode, the app uses local state only (no Supabase calls)
*/

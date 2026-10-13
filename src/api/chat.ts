import { createClient } from '@supabase/supabase-js';
import type { ChatMessage, ChatConversation } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchConversations(userId: string): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from('ai_assistant_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as ChatConversation[];
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('ai_assistant_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as ChatMessage[];
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (conversationId: string) => void;
  onError: (error: string) => void;
}

export async function streamAssistantResponse(
  payload: {
    message: string;
    conversationId?: string;
    userId: string;
    userRole: string;
    userName: string;
    contextType?: 'admin_assistant' | 'secretary_assistant';
    history?: { role: string; content: string }[];
  },
  callbacks: StreamCallbacks,
): Promise<void> {
  const url = `${supabaseUrl}/functions/v1/ai-assistant`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      callbacks.onError(errText || `Request failed (${response.status})`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          if (data.content) callbacks.onChunk(data.content);
          if (data.done && data.conversationId) callbacks.onDone(data.conversationId);
        } catch {
          /* skip malformed chunks */
        }
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : 'Network error');
  }
}

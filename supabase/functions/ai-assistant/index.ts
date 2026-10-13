import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  conversationId?: string;
  userId: string;
  userRole: string;
  userName: string;
  contextType?: "admin_assistant" | "secretary_assistant";
  history?: ChatMessage[];
}

const SYSTEM_PROMPTS: Record<string, string> = {
  admin_assistant: `You are the KHWWC Admin Assistant, an AI helper embedded in the KHWWC Welfare Management System. You assist administrators, treasurers, and super-admins with:

- Members and registrations (viewing, managing, importing)
- Contributions and payment tracking
- Penalties and penalty wallet management
- Donations and donation campaigns
- Withdrawals and approval workflows
- Beneficiaries and governance
- Banking and financial operations (statements, book balances, reconciliation)
- Bulk SMS, events, documents, news
- Defaulters tracking and notifications

Provide concise, practical answers. When a user asks about a specific operation, explain the steps clearly. If you don't know something specific about a member's data, tell them to check the relevant page in the system. Keep responses under 200 words unless the user asks for detail.`,

  secretary_assistant: `You are the KHWWC Secretary Assistant, an AI helper embedded in the KHWWC Welfare Management System. You assist secretaries, vice-secretaries, and chairpersons with:

- Meeting minutes (drafting, reviewing, approving)
- Meeting scheduling and agenda management
- Events management
- Signature uploads and document signing
- Withdrawal approval workflows
- Member communications and notifications
- Governance procedures and documentation

Provide concise, practical answers focused on secretariat and governance workflows. Keep responses under 200 words unless the user asks for detail.`,
};

const FALLBACK_RESPONSES = [
  "I can help you with member management, contributions, penalties, donations, withdrawals, banking, events, documents, and more. What would you like to know more about?",
  "Could you rephrase that? I'm here to help with KHWWC operations — members, contributions, withdrawals, meeting minutes, banking, and other system features.",
  "I'm not sure about that specific detail. Try checking the relevant page in the sidebar, or ask me about contributions, penalties, donations, withdrawals, events, or meeting minutes.",
];

const KEYWORD_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ["contribution", "contributions", "pay", "payment"],
    response: "Contributions are managed under the Contributions page. Admins can view all member contributions, confirm pending payments, and filter by status or period. Members see their own contribution history on their dashboard. Use the Import Data page to bulk-upload contribution records from a CSV file.",
  },
  {
    keywords: ["penalty", "penalties", "fine"],
    response: "Penalties are tracked per member. Admins can verify penalty payments under Verify Penalties, and manage the penalty wallet under Penalty Wallet. Members can pay outstanding penalties through the Pay Penalty page. Penalty amounts are configured in Settings.",
  },
  {
    keywords: ["withdrawal", "withdraw", "payout"],
    response: "Withdrawals go through a multi-step approval workflow: a member submits a request, then it needs approval from the secretary, treasurer, and chairperson. Check the Withdrawal Approval page to see pending approvals. Once fully approved, the treasurer processes the payout.",
  },
  {
    keywords: ["member", "registration", "register", "join"],
    response: "Member management is under the Members page. You can view all members, search by name or number, and click into a member's detail page. New registrations appear under Registration Mgmt for approval. The Import Data page supports bulk member uploads.",
  },
  {
    keywords: ["donation", "donate", "campaign"],
    response: "Donations are managed under Donations and Campaigns. You can create donation campaigns with target amounts, track contributions, and pause/complete campaigns. Members donate through the Donate page. The Donation Wallet tracks all donation funds separately.",
  },
  {
    keywords: ["meeting", "minutes", "agenda", "schedule"],
    response: "Meeting minutes are managed by the Secretary. Drafts are created, then sent for review to the Vice-Secretary, then approved by the Chairperson. Meeting scheduling lets you set up upcoming meetings with agenda items. Check the Minutes page in the Secretary section.",
  },
  {
    keywords: ["bank", "statement", "reconcil", "book balance"],
    response: "Banking tools are under Bank Diagnostics (for admins) and Bank Sync / Bank Statement pages (for treasurers). You can import bank statements, import book balances, and reconcile matched transactions. Unmatched payments appear under the Unmatched page for manual matching.",
  },
  {
    keywords: ["event", "events", "calendar"],
    response: "Events are managed under the Events page. You can create events with dates, locations, and descriptions. Members see upcoming events on their dashboard and can RSVP. Past events are archived automatically.",
  },
  {
    keywords: ["document", "documents", "upload", "file"],
    response: "Documents are managed under the Documents page. Admins can upload documents (PDFs, receipts, etc.) that members can then download from their Documents page. Documents can be categorized and have expiry dates.",
  },
  {
    keywords: ["sms", "message", "bulk", "notify", "notification"],
    response: "Bulk SMS lets you send messages to all members or filtered groups. Notifications are system-generated alerts that appear in each member's Notifications page. You can also configure automatic notifications for events like contribution confirmations or withdrawal approvals.",
  },
  {
    keywords: ["defaulter", "defaulters", "arrears", "overdue"],
    response: "The Defaulters page shows members who have missed contribution periods. Members are categorized as Warning, Critical, or Action based on how many periods they've missed. You can filter and sort to prioritize outreach.",
  },
  {
    keywords: ["beneficiary", "beneficiaries", "next of kin"],
    response: "Beneficiaries are managed by members through their Beneficiaries page. Admins can view all beneficiaries and handle beneficiary import. Beneficiary requests (e.g., updates) appear under Beneficiary Requests for admin review.",
  },
  {
    keywords: ["report", "reports", "summary", "statistics"],
    response: "Reports are available under the Treasurer Reports page, including wallet reports, contribution summaries, and expense reports. The admin dashboard shows key statistics like total members, contributions collected, and active campaigns.",
  },
  {
    keywords: ["expense", "expenses", "spending"],
    response: "Expenses are tracked under the Expenses page (treasurer). You can record expenses with categories, upload receipts, and submit for approval. Expense approval follows a workflow similar to withdrawals.",
  },
  {
    keywords: ["memo", "memos"],
    response: "Memos are created by the treasurer under Memos. You can draft a memo with a subject and body, then send it to all members. Memo history shows all sent and draft memos.",
  },
  {
    keywords: ["wallet", "wallets", "fund", "funds"],
    response: "There are three wallet types: Operational (for general expenses and payouts), Donation (for donation funds), and Penalty (for penalty payments). Each wallet has its own transaction history and balance tracking under the treasurer section.",
  },
  {
    keywords: ["setting", "settings", "config", "configure"],
    response: "System settings are under the Settings page. You can configure organization details, payout amounts (bereavement, medical, education), signature and stamp uploads, and other operational parameters.",
  },
  {
    keywords: ["audit", "log", "logs", "activity"],
    response: "Audit logs are available to super-admins under Audit Logs. They track all user actions across the system including logins, data changes, and administrative actions. You can filter by user, action type, and date range.",
  },
  {
    keywords: ["hello", "hi", "hey", "greeting"],
    response: "Hello! I'm the KHWWC Assistant. I can help you with members, contributions, penalties, donations, withdrawals, banking, events, documents, meeting minutes, and more. What do you need help with?",
  },
];

function generateResponse(message: string, contextType: string): string {
  const lower = message.toLowerCase();

  for (const entry of KEYWORD_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }

  if (lower.includes("?") || lower.length < 10) {
    return FALLBACK_RESPONSES[0];
  }

  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      message,
      conversationId,
      userId,
      userRole,
      userName,
      contextType = "admin_assistant",
      history = [],
    }: RequestBody = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Message and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const { data: conv } = await supabase
        .from("ai_assistant_conversations")
        .insert({
          user_id: userId,
          user_role: userRole,
          context_type: contextType,
          title: message.slice(0, 60),
        })
        .select("id")
        .single();
      convId = conv?.id;
    }

    // Save user message
    await supabase.from("ai_assistant_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // Generate response
    const systemPrompt = SYSTEM_PROMPTS[contextType] || SYSTEM_PROMPTS.admin_assistant;
    const responseText = generateResponse(message, contextType);

    // Save assistant message
    await supabase.from("ai_assistant_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: responseText,
    });

    // Update conversation timestamp
    await supabase
      .from("ai_assistant_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    // Stream the response as SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const words = responseText.split(" ");
        let index = 0;

        const interval = setInterval(() => {
          if (index < words.length) {
            const chunk = (index === 0 ? "" : " ") + words[index];
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`),
            );
            index++;
          } else {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ conversationId: convId, done: true })}\n\n`),
            );
            controller.close();
            clearInterval(interval);
          }
        }, 30);
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

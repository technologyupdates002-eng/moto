import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import ChatPage from '@/pages/member/ChatPage';

export function GroupChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-[76px] sm:right-6 sm:bottom-6 z-40 flex items-center justify-center gap-2 w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full bg-[#6c55c7] text-white shadow-[0_12px_28px_rgba(108,85,199,0.34)] transition-all hover:bg-[#5943b5] hover:-translate-y-1 active:scale-95"
          aria-label="Open group chat"
        >
          <MessageCircle size={22} />
          <span className="hidden sm:inline text-sm font-semibold">Group chat</span>
          <span className="absolute right-0 top-0 w-3.5 h-3.5 rounded-full bg-[#45c678] ring-2 ring-white" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-white sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[min(920px,calc(100vw-48px))] sm:h-[min(760px,calc(100vh-48px))] sm:rounded-[24px] sm:shadow-[0_22px_70px_rgba(31,22,70,0.28)] sm:overflow-hidden">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 text-neutral-700 shadow-md border border-neutral-200 hover:bg-white transition-colors"
            aria-label="Minimise group chat"
            title="Minimise chat"
          >
            <X size={18} />
          </button>
          <ChatPage className="h-full min-h-0 rounded-none border-0 shadow-none" />
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Message = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Props = {
  conversationId: string;
  parentMessage: Message;
  onClose: () => void;
  onReplyCountChange: (parentId: string, count: number) => void;
};

export function ThreadPanel({
  conversationId,
  parentMessage,
  onClose,
  onReplyCountChange,
}: Props) {
  const { data: session } = useSession();
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadReplies() {
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages/${parentMessage.id}/replies`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setReplies(Array.isArray(data) ? data : []);
      onReplyCountChange(parentMessage.id, Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadReplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentMessage.id]);
  useEffect(() => {
  const channel = supabase
    .channel(`thread-${parentMessage.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "Message",
        filter: `parentId=eq.${parentMessage.id}`,
      },
      (payload: any) => {
        const newReply = payload.new;
        setReplies((prev) => {
          if (prev.some((r) => r.id === newReply.id)) return prev;
          return [...prev, newReply];
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [parentMessage.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: input,
            parentId: parentMessage.id,
          }),
        }
      );
      if (res.ok) {
        const newReply = await res.json();
        setReplies((prev) => [...prev, newReply]);
        onReplyCountChange(parentMessage.id, replies.length + 1);
        setInput("");
      } else {
        toast.error("Failed to send reply");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed md:relative right-0 top-0 h-full w-full md:w-96 border-l border-border bg-background flex flex-col z-50 md:z-0 shadow-2xl md:shadow-none"
      >
        <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Thread
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Parent message */}
          <div className="pb-4 border-b border-border">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden text-white">
                {parentMessage.user?.image ? (
                  <img
                    src={parentMessage.user.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  parentMessage.user?.name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">
                    {parentMessage.user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(parentMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm mt-0.5 break-words">
                  {parentMessage.content}
                </p>
              </div>
            </div>
          </div>

          {/* Replies */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              No replies yet. Start the conversation.
            </div>
          ) : (
            replies.map((reply) => {
              const isMe = reply.userId === session?.user?.id;
              return (
                <div key={reply.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden text-white">
                    {reply.user?.image ? (
                      <img
                        src={reply.user.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      reply.user?.name?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {reply.user?.name || "User"}
                        {isMe && (
                          <span className="text-xs text-blue-500 ml-2">
                            (you)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(reply.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 break-words">
                      {reply.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={sendReply}
          className="border-t border-border p-3 flex-shrink-0"
        >
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Reply..."
              className="flex-1 rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </motion.aside>
    </AnimatePresence>
  );
}
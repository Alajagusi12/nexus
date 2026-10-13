"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ThreadPanel } from "@/components/thread-panel";
import {
  Send,
  MessageSquare,
  Loader2,
  Search,
  X,
  Plus,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  FileText,
  Download,
  Users,
  Pencil,
  MessageCircle,
  Pin,
  CheckSquare,
  Calendar,
} from "lucide-react";

type OtherUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  lastSeenAt?: string | null;
};

type Conversation = {
  id: string;
  isGroup: boolean;
  name: string | null;
  displayName: string;
  displayImage: string | null;
  memberCount: number;
  otherUser: OtherUser | null;
  members: OtherUser[];
  lastMessage: {
    content: string;
    createdAt: string;
    userName: string | null;
  } | null;
  updatedAt: string;
};

type Message = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  parentId?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
  reactions?: string | null;
  readAt?: string | null;
  editedAt?: string | null;
  _count?: { replies: number };
  replyCount?: number;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

const QUICK_EMOJIS = ["❤️", "👍", "🔥", "😂", "🎉"];
const FULL_EMOJIS = [
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
  "👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "✌️", "🤞",
  "🔥", "✨", "⭐", "🌟", "💫", "⚡", "💥", "🎉", "🎊",
  "😂", "🤣", "😊", "😁", "😍", "🥰", "😘", "😎", "🤔",
  "😅", "😉", "😢", "😭", "😡", "🤯", "🥳", "😴", "🤗",
  "🚀", "💡", "✅", "❌", "⚠️", "❓", "❗", "💯", "👀",
  "🍕", "☕", "🎯", "🏆", "📌", "📎", "💼", "📝",
];
const TYPING_TIMEOUT = 2000;

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "text-slate-400" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-400" },
  { value: "HIGH", label: "High", color: "text-orange-400" },
  { value: "URGENT", label: "Urgent", color: "text-red-400" },
];

export default function ChatPage() {
  const { data: session } = useSession();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<OtherUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<OtherUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState("");
  const [searchMsgResults, setSearchMsgResults] = useState<Message[]>([]);
  const [searchingMsgs, setSearchingMsgs] = useState(false);
  const [openThread, setOpenThread] = useState<Message | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedList, setShowPinnedList] = useState(false);
  const [actionSheetMsg, setActionSheetMsg] = useState<Message | null>(null);

  const [taskFromMessage, setTaskFromMessage] = useState<Message | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
  });
  const [creatingTask, setCreatingTask] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);
  const isCurrentlyTypingRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  async function loadConversations() {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
        const saved = sessionStorage.getItem("lastActiveConversation");
        if (saved && data.some((c: Conversation) => c.id === saved)) {
          setActiveId(saved);
        } else if (data.length > 0) {
          setActiveId((prev) => prev || data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvos(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeId) {
      sessionStorage.setItem("lastActiveConversation", activeId);
      setOpenThread(null);
      setShowPinnedList(false);
      loadPins();
    } else {
      setPinnedMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    setMessages([]);
    setOtherUserTyping(false);

    fetch(`/api/conversations/${activeId}/messages`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMessages(
          list.map((m: Message) => ({
            ...m,
            replyCount: m._count?.replies || 0,
          }))
        );
        setLoadingMessages(false);
      })
      .catch(() => setLoadingMessages(false));
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;

    const channel = supabase
      .channel(`conversation-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${activeId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new;
            if (newMsg.parentId) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newMsg.parentId
                    ? { ...m, replyCount: (m.replyCount || 0) + 1 }
                    : m
                )
              );
              return;
            }
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, replyCount: 0 }];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            );
          } else if (payload.eventType === "DELETE") {
            const oldMsg = payload.old;
            setMessages((prev) => prev.filter((m) => m.id !== oldMsg.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !session?.user?.id) return;

    const channel = supabase.channel(`typing-${activeId}`);

    channel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload.userId === session.user.id) return;
        if (payload.payload.userName) {
          setOtherUserTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, TYPING_TIMEOUT);
        }
      })
      .on("broadcast", { event: "stop-typing" }, (payload: any) => {
        if (payload.payload.userId === session.user.id) return;
        setOtherUserTyping(false);
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      setOtherUserTyping(false);
    };
  }, [activeId, session?.user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  useEffect(() => {
    if (!showSearch || !activeId) return;
    if (msgSearch.length < 2) {
      setSearchMsgResults([]);
      return;
    }
    setSearchingMsgs(true);
    const t = setTimeout(() => {
      fetch(
        `/api/conversations/${activeId}/search?q=${encodeURIComponent(msgSearch)}`,
        { cache: "no-store" }
      )
        .then((res) => res.json())
        .then((data) => {
          setSearchMsgResults(Array.isArray(data) ? data : []);
          setSearchingMsgs(false);
        })
        .catch(() => {
          setSearchMsgResults([]);
          setSearchingMsgs(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [msgSearch, showSearch, activeId]);

  useEffect(() => {
    if (!showNewDm) return;
    if (search.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(search)}`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(Array.isArray(data) ? data : []);
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, showNewDm]);

  async function loadPins() {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/conversations/${activeId}/pins`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPinnedMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  function toggleUser(user: OtherUser) {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  }

  async function startConversation() {
    if (selectedUsers.length === 0) return;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUserIds: selectedUsers.map((u) => u.id),
          name: selectedUsers.length > 1 ? groupName || "New group" : null,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setShowNewDm(false);
        setSearch("");
        setSearchResults([]);
        setSelectedUsers([]);
        setGroupName("");
        await loadConversations();
        setActiveId(data.id);
        toast.success(
          selectedUsers.length > 1 ? "Group created" : "Conversation started"
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start conversation");
    }
  }

  async function startCall(callType: "video" | "voice") {
    if (!activeId || !active) return;
    if (active.isGroup) {
      toast.error("Group calls coming soon");
      return;
    }
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, callType }),
      });
      const data = await res.json();
      if (data.id) {
        window.location.href = `/dashboard/chat/call/${data.id}`;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || !activeId) return;

    setSending(true);
    try {
      await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      setInput("");
      if (typingChannelRef.current && session?.user?.id) {
        isCurrentlyTypingRef.current = false;
        typingChannelRef.current.send({
          type: "broadcast",
          event: "stop-typing",
          payload: { userId: session.user.id },
        });
      }
      loadConversations();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await fetch(`/api/conversations/${activeId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "",
            fileUrl: base64,
            fileType: file.type,
            fileName: file.name,
          }),
        });
        setUploading(false);
        toast.success("File uploaded");
        loadConversations();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
      toast.error("Failed to upload");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!activeId || !session?.user?.id) return;
    setEmojiPickerFor(null);

    const userId = session.user.id;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = parseReactions(m.reactions);
        const users: string[] = reactions[emoji] || [];

        if (users.includes(userId)) {
          const updated = users.filter((id) => id !== userId);
          if (updated.length === 0) {
            delete reactions[emoji];
          } else {
            reactions[emoji] = updated;
          }
        } else {
          reactions[emoji] = [...users, userId];
        }

        return { ...m, reactions: JSON.stringify(reactions) };
      })
    );

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m))
        );
      }
    } catch (err) {
      console.error(err);
      fetch(`/api/conversations/${activeId}/messages`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(
              data.map((m: Message) => ({
                ...m,
                replyCount: m._count?.replies || 0,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }

  async function togglePin(msg: Message) {
    if (!activeId) return;
    setActionSheetMsg(null);

    const isPinned = pinnedMessages.some((p) => p.id === msg.id);

    if (isPinned) {
      setPinnedMessages((prev) => prev.filter((p) => p.id !== msg.id));
    } else {
      setPinnedMessages((prev) => [msg, ...prev]);
    }

    try {
      const res = await fetch(
        `/api/conversations/${activeId}/messages/${msg.id}/pin`,
        { method: "POST" }
      );
      if (res.ok) {
        const updated = await res.json();
        if (updated.pinnedAt) {
          setPinnedMessages((prev) => {
            if (prev.some((p) => p.id === updated.id)) return prev;
            return [updated, ...prev];
          });
          toast.success("Message pinned");
        } else {
          setPinnedMessages((prev) => prev.filter((p) => p.id !== updated.id));
          toast.success("Message unpinned");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to pin");
      loadPins();
    }
  }

  function scrollToMessage(messageId: string) {
    setShowPinnedList(false);
    setOpenThread(null);
    setTimeout(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-yellow-500", "rounded-lg");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-yellow-500", "rounded-lg");
        }, 2000);
      }
    }, 150);
  }

  async function startEditing(msg: Message) {
    setActionSheetMsg(null);
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  }

  async function saveEdit() {
    if (!editingMessageId || !editingContent.trim() || !activeId) return;
    try {
      const res = await fetch(
        `/api/conversations/${activeId}/messages/${editingMessageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editingContent }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessageId ? { ...m, ...updated } : m
          )
        );
        setEditingMessageId(null);
        setEditingContent("");
        toast.success("Message edited");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to edit");
    }
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setEditingContent("");
  }

  async function deleteMessage(messageId: string) {
    setActionSheetMsg(null);
    if (!activeId || !confirm("Delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await fetch(`/api/conversations/${activeId}/messages/${messageId}`, {
        method: "DELETE",
      });
      toast.success("Message deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  }

  function handleReplyCountChange(parentId: string, count: number) {
    setMessages((prev) =>
      prev.map((m) => (m.id === parentId ? { ...m, replyCount: count } : m))
    );
  }

  function handleMessageTouchStart(msg: Message) {
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setActionSheetMsg(msg);
      if ("vibrate" in navigator) navigator.vibrate(20);
    }, 500);
  }

  function handleMessageTouchEnd() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleMessageClick() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
  }

  function openTaskFromMessage(msg: Message) {
    setActionSheetMsg(null);
    setTaskFromMessage(msg);
    setTaskForm({
      title: msg.content?.slice(0, 100) || "Task from message",
      description: msg.content || "",
      priority: "MEDIUM",
      dueDate: "",
    });
  }

  async function createTaskFromMessage() {
    if (!taskFromMessage || !taskForm.title.trim()) return;
    setCreatingTask(true);

    try {
      const res = await fetch(`/api/messages/${taskFromMessage.id}/to-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          priority: taskForm.priority,
          dueDate: taskForm.dueDate || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      toast.success("Task created");
      setTaskFromMessage(null);
      setTaskForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  }

  function parseReactions(reactions: string | null | undefined) {
    if (!reactions) return {};
    try {
      return JSON.parse(reactions);
    } catch {
      return {};
    }
  }

  function getPresence(user: OtherUser | null | undefined) {
    if (!user?.lastSeenAt) return { isOnline: false, label: "Offline" };
    const lastSeen = new Date(user.lastSeenAt).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - lastSeen) / 1000);

    if (diffSec < 60) return { isOnline: true, label: "Online" };
    if (diffSec < 3600)
      return {
        isOnline: false,
        label: `Active ${Math.floor(diffSec / 60)}m ago`,
      };
    if (diffSec < 86400)
      return {
        isOnline: false,
        label: `Active ${Math.floor(diffSec / 3600)}h ago`,
      };
    return { isOnline: false, label: "Offline" };
  }

  const active = conversations.find((c) => c.id === activeId);
  return (
    <div className="flex h-full relative overflow-hidden">
      <aside
        className={`${
          activeId ? "hidden md:flex" : "flex"
        } w-full md:w-72 md:flex border-r border-border flex-col flex-shrink-0 absolute md:relative inset-0 md:inset-auto z-10 bg-background`}
      >
        <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chats
          </h2>
          <button
            onClick={() => setShowNewDm(true)}
            className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-muted text-sm">
              No conversations yet.
              <br />
              Click + to start one.
            </div>
          ) : (
            conversations.map((c) => {
              const presence =
                !c.isGroup && c.otherUser
                  ? getPresence(c.otherUser)
                  : { isOnline: false, label: "" };
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 border-b border-border/40 transition flex items-center gap-3 ${
                    activeId === c.id
                      ? "bg-blue-500/10"
                      : "hover:bg-foreground/5"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold overflow-hidden text-white">
                      {c.isGroup ? (
                        <Users className="w-4 h-4" />
                      ) : c.displayImage ? (
                        <img
                          src={c.displayImage}
                          alt={c.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        c.displayName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    {!c.isGroup && presence.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {c.displayName}
                      {c.isGroup && (
                        <span className="text-xs text-muted ml-1">
                          ({c.memberCount})
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        !c.isGroup && presence.isOnline
                          ? "text-green-500"
                          : "text-muted"
                      }`}
                    >
                      {!c.isGroup && c.otherUser
                        ? presence.label
                        : c.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {active ? (
        <div
          className={`${
            activeId ? "flex" : "hidden md:flex"
          } flex-1 flex flex-col min-w-0`}
        >
          <header className="border-b border-border px-3 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setActiveId(null)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-foreground/10 transition flex-shrink-0"
              aria-label="Back to chats"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold overflow-hidden text-white">
                {active.isGroup ? (
                  <Users className="w-4 h-4" />
                ) : active.displayImage ? (
                  <img
                    src={active.displayImage}
                    alt={active.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  active.displayName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              {!active.isGroup &&
                active.otherUser &&
                getPresence(active.otherUser).isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">{active.displayName}</h1>
              <p
                className={`text-xs truncate ${
                  !active.isGroup &&
                  active.otherUser &&
                  getPresence(active.otherUser).isOnline
                    ? "text-green-500"
                    : "text-muted"
                }`}
              >
                {active.isGroup
                  ? `${active.memberCount} members`
                  : active.otherUser
                  ? getPresence(active.otherUser).label
                  : ""}
              </p>
            </div>

            <button
              onClick={() => setShowSearch(true)}
              className="p-2.5 rounded-lg hover:bg-foreground/10 transition flex-shrink-0"
              title="Search messages"
            >
              <Search className="w-5 h-5 text-muted" />
            </button>

            {!active.isGroup && (
              <>
                <button
                  onClick={() => startCall("voice")}
                  className="p-2.5 rounded-lg hover:bg-foreground/10 transition"
                  title="Voice call"
                >
                  <Phone className="w-5 h-5 text-muted" />
                </button>
                <button
                  onClick={() => startCall("video")}
                  className="p-2.5 rounded-lg hover:bg-foreground/10 transition"
                  title="Video call"
                >
                  <Video className="w-5 h-5 text-muted" />
                </button>
              </>
            )}
          </header>

          {pinnedMessages.length > 0 && (
            <button
              onClick={() => setShowPinnedList(true)}
              className="w-full flex items-center gap-2 px-3 md:px-6 py-2 border-b border-border bg-yellow-500/5 hover:bg-yellow-500/10 transition text-left"
            >
              <Pin className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              <span className="text-xs font-medium text-foreground/80 truncate flex-1">
                <span className="text-yellow-500 font-semibold">
                  {pinnedMessages.length}{" "}
                  {pinnedMessages.length === 1 ? "pin" : "pins"}
                </span>
                {" — "}
                {pinnedMessages[0]?.content || "📎 Attachment"}
              </span>
              <span className="text-xs text-muted flex-shrink-0">
                View all
              </span>
            </button>
          )}

          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No messages yet. Say hi!</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isMe = msg.userId === session?.user?.id;
                  const reactions = parseReactions(msg.reactions);
                  const reactionKeys = Object.keys(reactions);
                  const isImage = msg.fileType?.startsWith("image/");
                  const replyCount = msg.replyCount || 0;
                  return (
                    <motion.div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3 group relative transition-all"
                      onTouchStart={() => handleMessageTouchStart(msg)}
                      onTouchEnd={handleMessageTouchEnd}
                      onTouchMove={handleMessageTouchEnd}
                      onClick={handleMessageClick}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-semibold text-sm flex-shrink-0 overflow-hidden text-white">
                        {msg.user?.image ? (
                          <img
                            src={msg.user.image}
                            alt={msg.user.name || "user"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          msg.user?.name?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {msg.user?.name || "User"}
                            {isMe && (
                              <span className="text-xs text-blue-500 ml-2">
                                (you)
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && (
                            <span className="ml-1">
                              {msg.readAt ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-muted" />
                              )}
                            </span>
                          )}
                        </div>

                        {msg.fileUrl && isImage && (
                          <div className="mt-2">
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName || "attachment"}
                              className="max-w-[240px] md:max-w-sm rounded-xl border border-border"
                            />
                          </div>
                        )}

                        {msg.fileUrl && !isImage && (
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName || "file"}
                            className="mt-2 inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 transition max-w-sm"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {msg.fileName || "File"}
                              </p>
                              <p className="text-xs text-muted">
                                Click to download
                              </p>
                            </div>
                            <Download className="w-4 h-4 text-muted flex-shrink-0" />
                          </a>
                        )}

                        {editingMessageId === msg.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) =>
                                setEditingContent(e.target.value)
                              }
                              rows={2}
                              autoFocus
                              className="w-full rounded-xl border border-blue-500/50 bg-foreground/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEdit}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-xs font-semibold transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          msg.content && (
                            <p className="text-foreground/80 text-sm mt-0.5 break-words">
                              {msg.content}
                              {msg.editedAt && (
                                <span className="text-[10px] text-muted ml-2">
                                  (edited)
                                </span>
                              )}
                            </p>
                          )
                        )}

                        {reactionKeys.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {reactionKeys.map((emoji) => {
                              const users: string[] = reactions[emoji];
                              const mine = users.includes(
                                session?.user?.id || ""
                              );
                              return (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    toggleReaction(msg.id, emoji)
                                  }
                                  className={`px-2 py-0.5 rounded-full border text-xs transition ${
                                    mine
                                      ? "bg-blue-500/20 border-blue-500/40 text-blue-500 dark:text-blue-300"
                                      : "bg-foreground/5 border-border hover:bg-foreground/10"
                                  }`}
                                >
                                  {emoji} {users.length}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {replyCount > 0 && (
                          <button
                            onClick={() => setOpenThread(msg)}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-400 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {replyCount}{" "}
                            {replyCount === 1 ? "reply" : "replies"}
                          </button>
                        )}
                      </div>

                      <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition items-start gap-1">
                        <button
                          onClick={() => openTaskFromMessage(msg)}
                          className="p-1.5 rounded-lg hover:bg-green-500/20 transition"
                          title="Turn into task"
                        >
                          <CheckSquare className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          onClick={() => setOpenThread(msg)}
                          className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
                          title="Reply in thread"
                        >
                          <MessageCircle className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          onClick={() => togglePin(msg)}
                          className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
                          title={
                            pinnedMessages.some((p) => p.id === msg.id)
                              ? "Unpin"
                              : "Pin"
                          }
                        >
                          <Pin
                            className={`w-4 h-4 ${
                              pinnedMessages.some((p) => p.id === msg.id)
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-muted"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() =>
                            setEmojiPickerFor(
                              emojiPickerFor === msg.id ? null : msg.id
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
                        >
                          <Smile className="w-4 h-4 text-muted" />
                        </button>
                        {isMe && msg.content && (
                          <button
                            onClick={() => startEditing(msg)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/20 transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </button>
                        )}
                        {isMe && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 transition"
                            title="Delete"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>

                      {emojiPickerFor === msg.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40 md:hidden"
                            onClick={() => setEmojiPickerFor(null)}
                          />
                          <div className="absolute right-0 md:right-12 bottom-full md:bottom-auto md:top-0 mb-2 md:mb-0 p-2 rounded-xl bg-card border border-border shadow-2xl z-50 w-[300px] md:w-auto">
                            <div className="grid grid-cols-8 md:flex md:flex-wrap gap-1 max-h-48 md:max-h-none overflow-y-auto">
                              {FULL_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleReaction(msg.id, emoji);
                                  }}
                                  className="w-8 h-8 rounded-lg hover:bg-foreground/10 transition text-lg flex items-center justify-center"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {otherUserTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-muted pl-12"
              >
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span>
                  {active.isGroup
                    ? "Someone is typing..."
                    : `${active.otherUser?.name || "Someone"} is typing...`}
                </span>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-border p-3 md:p-4 flex-shrink-0"
          >
            <div className="flex gap-3 items-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2.5 rounded-xl hover:bg-foreground/10 transition"
                title="Attach file"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                ) : (
                  <Paperclip className="w-5 h-5 text-muted" />
                )}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);

                  if (
                    typingChannelRef.current &&
                    session?.user?.id &&
                    activeId
                  ) {
                    if (!isCurrentlyTypingRef.current) {
                      isCurrentlyTypingRef.current = true;
                      typingChannelRef.current.send({
                        type: "broadcast",
                        event: "typing",
                        payload: {
                          userId: session.user.id,
                          userName: session.user.name || "Someone",
                        },
                      });
                    }

                    if (typingTimeoutRef.current)
                      clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      isCurrentlyTypingRef.current = false;
                      typingChannelRef.current?.send({
                        type: "broadcast",
                        event: "stop-typing",
                        payload: { userId: session.user.id },
                      });
                    }, TYPING_TIMEOUT);
                  }
                }}
                placeholder={`Message ${active.displayName}`}
                className="flex-1 rounded-xl border border-border bg-foreground/5 px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Select a conversation or start a new one</p>
          </div>
        </div>
      )}

      {openThread && activeId && (
        <ThreadPanel
          conversationId={activeId}
          parentMessage={openThread}
          onClose={() => setOpenThread(null)}
          onReplyCountChange={handleReplyCountChange}
        />
      )}
      {/* Pinned messages list */}
      {showPinnedList && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          onClick={() => setShowPinnedList(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                Pinned messages
              </h3>
              <button
                onClick={() => setShowPinnedList(false)}
                className="p-1 rounded-lg hover:bg-foreground/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {pinnedMessages.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">
                  No pinned messages yet
                </div>
              ) : (
                pinnedMessages.map((pin) => (
                  <div
                    key={pin.id}
                    className="p-4 border-b border-border/40 hover:bg-foreground/5 transition group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => scrollToMessage(pin.id)}
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {pin.user?.name || "User"}
                          </span>
                          <span className="text-[10px] text-muted">
                            {new Date(pin.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {pin.content || "📎 Attachment"}
                        </p>
                      </div>
                      <button
                        onClick={() => togglePin(pin)}
                        className="p-1.5 rounded-lg hover:bg-yellow-500/20 transition flex-shrink-0"
                        title="Unpin"
                      >
                        <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile action sheet (long-press) */}
      <AnimatePresence>
        {actionSheetMsg && (
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setActionSheetMsg(null)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-sm bg-card border-t md:border border-border rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden pb-4 md:pb-0"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted/40" />
              </div>

              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs text-muted mb-1">
                  {actionSheetMsg.user?.name || "User"}
                </p>
                <p className="text-sm text-foreground line-clamp-2">
                  {actionSheetMsg.content || "📎 Attachment"}
                </p>
              </div>

              <div className="px-3 py-2 border-b border-border">
                <div className="flex gap-1 justify-between">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        toggleReaction(actionSheetMsg.id, emoji);
                        setActionSheetMsg(null);
                      }}
                      className="flex-1 h-12 rounded-xl hover:bg-foreground/10 transition text-2xl active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setEmojiPickerFor(actionSheetMsg.id);
                      setActionSheetMsg(null);
                    }}
                    className="flex-1 h-12 rounded-xl hover:bg-foreground/10 transition flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-5 h-5 text-muted" />
                  </button>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => openTaskFromMessage(actionSheetMsg)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/5 transition text-left"
                >
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Turn into task</span>
                </button>

                <button
                  onClick={() => {
                    setOpenThread(actionSheetMsg);
                    setActionSheetMsg(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/5 transition text-left"
                >
                  <MessageCircle className="w-5 h-5 text-muted" />
                  <span className="text-sm font-medium">Reply in thread</span>
                </button>

                <button
                  onClick={() => togglePin(actionSheetMsg)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/5 transition text-left"
                >
                  <Pin
                    className={`w-5 h-5 ${
                      pinnedMessages.some((p) => p.id === actionSheetMsg.id)
                        ? "text-yellow-500"
                        : "text-muted"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {pinnedMessages.some((p) => p.id === actionSheetMsg.id)
                      ? "Unpin message"
                      : "Pin message"}
                  </span>
                </button>

                {actionSheetMsg.userId === session?.user?.id &&
                  actionSheetMsg.content && (
                    <button
                      onClick={() => startEditing(actionSheetMsg)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/5 transition text-left"
                    >
                      <Pencil className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">Edit message</span>
                    </button>
                  )}

                {actionSheetMsg.userId === session?.user?.id && (
                  <button
                    onClick={() => deleteMessage(actionSheetMsg.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition text-left"
                  >
                    <X className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      Delete message
                    </span>
                  </button>
                )}
              </div>

              <div className="px-3 pt-2 md:hidden">
                <button
                  onClick={() => setActionSheetMsg(null)}
                  className="w-full py-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task-from-message modal */}
      <AnimatePresence>
        {taskFromMessage && (
          <div
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => !creatingTask && setTaskFromMessage(null)}
          >
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-lg bg-card border-t md:border border-border rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-muted/40" />
              </div>

              <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  Create task
                </h3>
                <button
                  onClick={() => setTaskFromMessage(null)}
                  disabled={creatingTask}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 transition disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-xl bg-foreground/5 border border-border p-3">
                  <p className="text-[10px] text-muted mb-1 uppercase tracking-wider">
                    From message
                  </p>
                  <p className="text-xs text-foreground/80 line-clamp-2">
                    {taskFromMessage.content || "📎 Attachment"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">
                    Title
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    autoFocus
                    className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    placeholder="What needs to be done?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
                    placeholder="Add details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() =>
                          setTaskForm({
                            ...taskForm,
                            priority: p.value as any,
                          })
                        }
                        className={`py-2.5 rounded-xl border text-xs font-medium transition ${
                          taskForm.priority === p.value
                            ? "border-green-500/50 bg-green-500/10 " + p.color
                            : "border-border bg-foreground/5 hover:bg-foreground/10 text-muted"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">
                    Due date (optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, dueDate: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-foreground/5 pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex-shrink-0 flex gap-2 pb-6 md:pb-4">
                <button
                  onClick={() => setTaskFromMessage(null)}
                  disabled={creatingTask}
                  className="flex-1 py-3 rounded-xl border border-border hover:bg-foreground/5 transition text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createTaskFromMessage}
                  disabled={creatingTask || !taskForm.title.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 transition text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingTask ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create task"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New DM modal */}
      {showNewDm && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          onClick={() => {
            setShowNewDm(false);
            setSelectedUsers([]);
            setSearch("");
            setSearchResults([]);
            setGroupName("");
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">
                {selectedUsers.length > 1
                  ? `New group (${selectedUsers.length})`
                  : "New Message"}
              </h3>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNewDm(false);
                  setSelectedUsers([]);
                  setSearch("");
                  setSearchResults([]);
                  setGroupName("");
                }}
                className="p-1 rounded-lg hover:bg-foreground/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedUsers.length > 0 && (
              <div className="p-3 border-b border-border flex flex-wrap gap-2">
                {selectedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs"
                  >
                    <span className="truncate max-w-[100px]">
                      {u.name || u.email}
                    </span>
                    <button onClick={() => toggleUser(u)}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedUsers.length > 1 && (
              <div className="p-3 border-b border-border">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  className="w-full rounded-lg border border-border bg-foreground/5 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            )}

            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  autoFocus
                  className="w-full rounded-xl border border-border bg-foreground/5 pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted text-sm">
                  {search ? "No users found" : "Start typing to search"}
                </div>
              ) : (
                searchResults.map((user) => {
                  const selected = selectedUsers.some((u) => u.id === user.id);
                  return (
                    <div
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleUser(user);
                      }}
                      className={`w-full text-left p-3 hover:bg-foreground/5 transition flex items-center gap-3 border-b border-border/40 cursor-pointer select-none ${
                        selected ? "bg-blue-500/10" : ""
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden text-white pointer-events-none">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || "user"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.name?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pointer-events-none">
                        <p className="text-sm font-medium truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {user.email}
                        </p>
                      </div>
                      {selected && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={startConversation}
                  className="w-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 py-3 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition"
                >
                  {selectedUsers.length > 1
                    ? `Create group with ${selectedUsers.length} people`
                    : `Chat with ${
                        selectedUsers[0].name || selectedUsers[0].email
                      }`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message search modal */}
      {showSearch && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          onClick={() => {
            setShowSearch(false);
            setMsgSearch("");
            setSearchMsgResults([]);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-4 h-4 text-muted flex-shrink-0" />
              <input
                type="text"
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                placeholder="Search messages..."
                autoFocus
                className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setMsgSearch("");
                  setSearchMsgResults([]);
                }}
                className="p-1 rounded-lg hover:bg-foreground/10 transition flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {msgSearch.length < 2 ? (
                <div className="text-center py-8 px-4 text-muted text-sm">
                  Type at least 2 characters to search
                </div>
              ) : searchingMsgs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                </div>
              ) : searchMsgResults.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted text-sm">
                  No messages found for &quot;{msgSearch}&quot;
                </div>
              ) : (
                searchMsgResults.map((msg) => (
                  <div
                    key={msg.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const el = document.getElementById(`msg-${msg.id}`);
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        el.classList.add(
                          "ring-2",
                          "ring-blue-500",
                          "rounded-lg"
                        );
                        setTimeout(() => {
                          el.classList.remove(
                            "ring-2",
                            "ring-blue-500",
                            "rounded-lg"
                          );
                        }, 2000);
                      }
                      setShowSearch(false);
                      setMsgSearch("");
                      setSearchMsgResults([]);
                    }}
                    className="w-full text-left p-3 hover:bg-foreground/5 transition border-b border-border/40 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold flex-shrink-0 text-white pointer-events-none">
                        {msg.user?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs font-medium truncate pointer-events-none">
                        {msg.user?.name || "User"}
                      </span>
                      <span className="text-[10px] text-muted pointer-events-none">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-2 pointer-events-none">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
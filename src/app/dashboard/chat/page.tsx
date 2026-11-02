"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { ThreadPanel } from "@/components/thread-panel";
import { AIPanel } from "@/components/ai-panel";
import { GroupCall } from "@/components/group-call";
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
  Clock,
  FileText,
  Download,
  Users,
  Pencil,
  MessageCircle,
  Pin,
  CheckSquare,
  Calendar,
  Sparkles,
  Trash2,
  Copy,
  MoreHorizontal,
  BellOff,
  ArrowDown,
  Mic,
  Forward,
  Mail,
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
  conversationId?: string;
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
  pending?: boolean;
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
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "text-slate-400" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-400" },
  { value: "HIGH", label: "High", color: "text-orange-400" },
  { value: "URGENT", label: "Urgent", color: "text-red-400" },
];

/* ---------- module-scope helpers ---------- */

function parseReactions(reactions: string | null | undefined): Record<string, string[]> {
  if (!reactions) return {};
  try {
    const parsed = JSON.parse(reactions);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function getPresence(user: OtherUser | null | undefined) {
  if (!user?.lastSeenAt) return { isOnline: false, label: "Offline" };
  const lastSeen = new Date(user.lastSeenAt).getTime();
  const diffSec = Math.floor((Date.now() - lastSeen) / 1000);
  if (diffSec < 60) return { isOnline: true, label: "Online" };
  if (diffSec < 3600) return { isOnline: false, label: `Active ${Math.floor(diffSec / 60)}m ago` };
  if (diffSec < 86400) return { isOnline: false, label: `Active ${Math.floor(diffSec / 3600)}h ago` };
  return { isOnline: false, label: "Offline" };
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.floor((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function sameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function shouldGroup(prev: Message | undefined, current: Message) {
  if (!prev) return false;
  if (prev.userId !== current.userId) return false;
  if (prev.parentId || current.parentId) return false;
  if (!sameDay(prev.createdAt, current.createdAt)) return false;
  const dt = new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return dt >= 0 && dt <= GROUP_WINDOW_MS;
}

function renderContent(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2 break-all" onClick={(e) => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatPage() {
  const { data: session } = useSession();
  const prefersReducedMotion = useReducedMotion();

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
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showGroupCall, setShowGroupCall] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Advanced State
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [taskFromMessage, setTaskFromMessage] = useState<Message | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
  });
  const [creatingTask, setCreatingTask] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);
  const isCurrentlyTypingRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

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
      setShowAIPanel(false);
      setShowGroupCall(false);
      setShowHeaderMenu(false);
      loadPins();
      setUnreadIds(prev => { const next = new Set(prev); next.delete(activeId); return next; });
    } else {
      setPinnedMessages([]);
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    setMessages([]);
    setOtherUserTyping(false);
    setShowScrollDown(false);

    fetch(`/api/conversations/${activeId}/messages`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMessages(list.map((m: Message) => ({ ...m, replyCount: m._count?.replies || 0 })));
        setLoadingMessages(false);
      })
      .catch(() => setLoadingMessages(false));
  }, [activeId]);

  // Global Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (previewImage) setPreviewImage(null);
      else if (actionSheetMsg) setActionSheetMsg(null);
      else if (taskFromMessage) setTaskFromMessage(null);
      else if (forwardMsg) setForwardMsg(null);
      else if (showNewDm) { setShowNewDm(false); setSelectedUsers([]); setSearch(""); setSearchResults([]); setGroupName(""); }
      else if (showSearch) { setShowSearch(false); setMsgSearch(""); setSearchMsgResults([]); }
      else if (showPinnedList) setShowPinnedList(false);
      else if (emojiPickerFor) setEmojiPickerFor(null);
      else if (showHeaderMenu) setShowHeaderMenu(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewImage, actionSheetMsg, taskFromMessage, forwardMsg, showNewDm, showSearch, showPinnedList, emojiPickerFor, showHeaderMenu]);

  // Supabase Realtime
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`conversation-${activeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "Message", filter: `conversationId=eq.${activeId}` }, (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new;
            if (newMsg.parentId) {
              setMessages((prev) => prev.map((m) => m.id === newMsg.parentId ? { ...m, replyCount: (m.replyCount || 0) + 1 } : m));
              return;
            }
            setMessages((prev) => {
              const withoutOptimistic = prev.filter((m) => !(m.pending && m.content === newMsg.content && m.userId === newMsg.userId));
              if (withoutOptimistic.some((m) => m.id === newMsg.id)) return withoutOptimistic;
              return [...withoutOptimistic, { ...newMsg, replyCount: 0, pending: false }];
            });
            if (newMsg.userId !== session?.user?.id) {
              if (activeId !== newMsg.conversationId) {
                setUnreadIds((prev) => new Set(prev).add(newMsg.conversationId));
              } else {
                const el = scrollContainerRef.current;
                if (el && el.scrollHeight - el.scrollTop - el.clientHeight > 150) {
                  setShowScrollDown(true);
                } else {
                  setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" }), 50);
                }
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new;
            setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated, pending: false } : m)));
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, session?.user?.id, prefersReducedMotion]);

  // Typing indicators
  useEffect(() => {
    if (!activeId || !session?.user?.id) return;
    const channel = supabase.channel(`typing-${activeId}`);
    channel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload.userId === session.user.id) return;
        if (payload.payload.userName) {
          setOtherUserTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), TYPING_TIMEOUT);
        }
      })
      .on("broadcast", { event: "stop-typing" }, (payload: any) => {
        if (payload.payload.userId === session.user.id) return;
        setOtherUserTyping(false);
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); typingChannelRef.current = null; setOtherUserTyping(false); };
  }, [activeId, session?.user?.id]);

  useEffect(() => {
    if (messages.length > 0 || otherUserTyping) {
      bottomRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }, [messages, otherUserTyping, prefersReducedMotion]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    setShowScrollDown(!nearBottom);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    setShowScrollDown(false);
  }

  // Search messages
  useEffect(() => {
    if (!showSearch || !activeId) return;
    if (msgSearch.length < 2) { setSearchMsgResults([]); return; }
    setSearchingMsgs(true);
    const t = setTimeout(() => {
      fetch(`/api/conversations/${activeId}/search?q=${encodeURIComponent(msgSearch)}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => { setSearchMsgResults(Array.isArray(data) ? data : []); setSearchingMsgs(false); })
        .catch(() => { setSearchMsgResults([]); setSearchingMsgs(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [msgSearch, showSearch, activeId]);

  // Search users
  useEffect(() => {
    if (!showNewDm) return;
    if (search.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(search)}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.users) setSearchResults(Array.isArray(data.users) ? data.users : []);
          else setSearchResults(Array.isArray(data) ? data : []);
          setSearching(false);
        }).catch(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, showNewDm]);

  async function loadPins() {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/conversations/${activeId}/pins`, { cache: "no-store" });
      const data = await res.json();
      setPinnedMessages(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  }

  function toggleUser(user: OtherUser) {
    setSelectedUsers((prev) => prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]);
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
        setShowNewDm(false); setSearch(""); setSearchResults([]); setSelectedUsers([]); setGroupName("");
        await loadConversations();
        setActiveId(data.id);
        toast.success(selectedUsers.length > 1 ? "Group created" : "Conversation started");
      }
    } catch (err) { console.error(err); toast.error("Failed to start conversation"); }
  }

  async function startCall(callType: "video" | "voice") {
    const active = conversations.find((c) => c.id === activeId);
    if (!activeId || !active) return;
    if (active.isGroup) { setShowGroupCall(true); return; }
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, callType }),
      });
      const data = await res.json();
      if (data.id) window.location.href = `/dashboard/chat/call/${data.id}`;
    } catch (err) { console.error(err); }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !activeId || !session?.user) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId, content: trimmed, userId: session.user.id, createdAt: new Date().toISOString(), pending: true, replyCount: 0,
      user: { id: session.user.id, name: session.user.name ?? null, email: session.user.email ?? "", image: session.user.image ?? null },
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (typingChannelRef.current && session.user.id) {
        isCurrentlyTypingRef.current = false;
        typingChannelRef.current.send({ type: "broadcast", event: "stop-typing", payload: { userId: session.user.id } });
      }
      loadConversations();
    } catch (err) {
      console.error(err); toast.error("Failed to send");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  // Voice Note Recording
  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop()); // Stop mic
        await uploadAndSendFile(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied or unavailable.");
    }
  }

  async function uploadAndSendFile(file: File) {
    if (!activeId) return;
    setUploading(true);
    try {
      const { uploadFile } = await import("@/lib/storage");
      const result = await uploadFile(file, "attachments", activeId);
      if (result.error) { toast.error("Upload failed: " + result.error); return; }
      await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", fileUrl: result.url, fileType: file.type, fileName: file.name }),
      });
      loadConversations();
    } catch (err) { console.error(err); toast.error("Failed to upload"); } 
    finally { setUploading(false); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Max 10MB."); return; }
    await uploadAndSendFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!activeId || !session?.user?.id) return;
    setEmojiPickerFor(null);
    const userId = session.user.id;
    setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = parseReactions(m.reactions);
        const users: string[] = reactions[emoji] || [];
        if (users.includes(userId)) {
          const updated = users.filter((id) => id !== userId);
          if (updated.length === 0) delete reactions[emoji];
          else reactions[emoji] = updated;
        } else { reactions[emoji] = [...users, userId]; }
        return { ...m, reactions: JSON.stringify(reactions) };
    }));
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m)));
      }
    } catch (err) { console.error(err); }
  }

  async function togglePin(msg: Message) {
    if (!activeId) return;
    setActionSheetMsg(null);
    const isPinned = pinnedMessages.some((p) => p.id === msg.id);
    if (isPinned) setPinnedMessages((prev) => prev.filter((p) => p.id !== msg.id));
    else setPinnedMessages((prev) => [msg, ...prev]);
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages/${msg.id}/pin`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        if (updated.pinnedAt) toast.success("Message pinned");
        else { setPinnedMessages((prev) => prev.filter((p) => p.id !== updated.id)); toast.success("Message unpinned"); }
      }
    } catch (err) { console.error(err); toast.error("Failed to pin"); loadPins(); }
  }

  async function forwardMessage(targetConversationId: string) {
    if (!forwardMsg) return;
    try {
      await fetch(`/api/conversations/${targetConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: forwardMsg.content,
          fileUrl: forwardMsg.fileUrl,
          fileType: forwardMsg.fileType,
          fileName: forwardMsg.fileName
        }),
      });
      toast.success("Message forwarded");
      setForwardMsg(null);
      setActionSheetMsg(null);
    } catch (err) {
      toast.error("Failed to forward message");
    }
  }

  function markAsUnread() {
    if (activeId) {
      setUnreadIds(prev => new Set(prev).add(activeId));
      setActiveId(null);
      toast.success("Marked as unread");
    }
  }

  function scrollToMessage(messageId: string) {
    setShowPinnedList(false); setOpenThread(null);
    setTimeout(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-yellow-500", "rounded-lg");
        setTimeout(() => { el.classList.remove("ring-2", "ring-yellow-500", "rounded-lg"); }, 2000);
      }
    }, 150);
  }

  async function startEditing(msg: Message) { setActionSheetMsg(null); setEditingMessageId(msg.id); setEditingContent(msg.content); }

  async function saveEdit() {
    if (!editingMessageId || !editingContent.trim() || !activeId) return;
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages/${editingMessageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? { ...m, ...updated } : m)));
        setEditingMessageId(null); setEditingContent(""); toast.success("Message edited");
      }
    } catch (err) { console.error(err); toast.error("Failed to edit"); }
  }

  function cancelEdit() { setEditingMessageId(null); setEditingContent(""); }

  async function deleteMessage(messageId: string) {
    setActionSheetMsg(null);
    if (!activeId || !confirm("Delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await fetch(`/api/conversations/${activeId}/messages/${messageId}`, {
        method: "DELETE",
      });
      toast.success("Message deleted");
    } catch (err) { console.error(err); toast.error("Failed to delete"); }
  }

  async function deleteConversation() {
    if (!activeId) return;
    setShowHeaderMenu(false);
    if (!confirm("Delete this entire conversation? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/conversations/${activeId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Chat deleted"); setMessages([]); setActiveId(null); sessionStorage.removeItem("lastActiveConversation"); loadConversations();
      } else { toast.error("Failed to delete chat"); }
    } catch (err) { console.error(err); toast.error("Failed to delete chat"); }
  }

  async function copyMessage(text: string) {
    if (!text) { toast.error("Nothing to copy"); return; }
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); } 
    catch { toast.error("Failed to copy"); }
  }

  function handleReplyCountChange(parentId: string, count: number) {
    setMessages((prev) => prev.map((m) => (m.id === parentId ? { ...m, replyCount: count } : m)));
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
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
  }

  function handleMessageClick() {
    if (longPressTriggeredRef.current) { longPressTriggeredRef.current = false; return; }
  }

  function openTaskFromMessage(msg: Message) {
    setActionSheetMsg(null);
    setTaskFromMessage(msg);
    setTaskForm({ title: msg.content?.slice(0, 100) || "Task from message", description: msg.content || "", priority: "MEDIUM", dueDate: "" });
  }

  async function createTaskFromMessage() {
    if (!taskFromMessage || !taskForm.title.trim()) return;
    setCreatingTask(true);
    try {
      const res = await fetch(`/api/messages/${taskFromMessage.id}/to-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskForm.title.trim(), description: taskForm.description.trim(), priority: taskForm.priority, dueDate: taskForm.dueDate || null }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
      toast.success("Task created"); setTaskFromMessage(null); setTaskForm({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
    } catch (err: any) { console.error(err); toast.error(err.message || "Failed to create task"); } 
    finally { setCreatingTask(false); }
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-full relative overflow-hidden bg-background">
      {/* ===================== SIDEBAR ===================== */}
      <aside className={`${activeId ? "hidden lg:flex" : "flex"} w-full lg:w-72 lg:flex border-r border-border flex-col flex-shrink-0 absolute lg:relative inset-0 lg:inset-auto z-10 bg-background`}>
        <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" /> Messages
          </h2>
          <button onClick={() => setShowNewDm(true)} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] text-muted hover:text-foreground transition" title="New conversation">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3"><MessageSquare className="w-7 h-7 text-emerald-500" /></div>
              <p className="text-sm font-semibold text-foreground mb-1">No conversations yet</p>
              <p className="text-xs text-muted mb-4 leading-relaxed">Start a chat with a teammate to begin collaborating.</p>
              <button onClick={() => setShowNewDm(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition">
                <Plus className="w-3.5 h-3.5" /> New conversation
              </button>
            </div>
          ) : (
            conversations.map((c) => {
              const presence = !c.isGroup && c.otherUser ? getPresence(c.otherUser) : { isOnline: false, label: "" };
              const isActive = activeId === c.id;
              const isUnread = unreadIds.has(c.id);
              
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full text-left px-4 py-2.5 border-l-2 transition flex items-center gap-3 ${isActive ? "border-emerald-500 bg-foreground/[0.04]" : "border-transparent hover:bg-foreground/[0.025]"}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[13px] font-semibold overflow-hidden text-white">
                      {c.isGroup ? <Users className="w-4 h-4" /> : c.displayImage ? <img src={c.displayImage} alt={c.displayName} className="w-full h-full object-cover" /> : c.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                    {!c.isGroup && presence.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[13.5px] font-medium truncate text-foreground flex items-center gap-1.5">
                        {c.displayName}
                        {c.isGroup && <span className="text-[11px] text-muted ml-1 font-normal">· {c.memberCount}</span>}
                        {isUnread && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                      </p>
                      {c.lastMessage?.createdAt && (
                        <span className="text-[10.5px] text-muted/70 flex-shrink-0">
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[12px] truncate mt-0.5 ${!c.isGroup && presence.isOnline ? "text-emerald-500" : "text-muted"}`}>
                      {!c.isGroup && c.otherUser ? presence.label : c.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ===================== MAIN PANEL ===================== */}
      {active ? (
        <div className={`${activeId ? "flex" : "hidden lg:flex"} flex-1 flex-col min-w-0 relative`}>
          {/* Header */}
          <header className="border-b border-border px-3 md:px-5 py-3 flex items-center gap-2 flex-shrink-0 bg-background z-10">
            <button onClick={() => setActiveId(null)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-foreground/[0.06] transition flex-shrink-0" aria-label="Back to chats">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[13px] font-semibold overflow-hidden text-white">
                {active.isGroup ? <Users className="w-4 h-4" /> : active.displayImage ? <img src={active.displayImage} alt={active.displayName} className="w-full h-full object-cover" /> : active.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              {!active.isGroup && active.otherUser && getPresence(active.otherUser).isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[14.5px] font-semibold tracking-tight truncate">{active.displayName}</h1>
              <p className={`text-[11.5px] truncate ${!active.isGroup && active.otherUser && getPresence(active.otherUser).isOnline ? "text-emerald-500" : "text-muted"}`}>
                {active.isGroup ? `${active.memberCount} members` : active.otherUser ? getPresence(active.otherUser).label : ""}
              </p>
            </div>
            <button onClick={() => setShowAIPanel(!showAIPanel)} className={`p-2 rounded-lg transition flex-shrink-0 ${showAIPanel ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-foreground/[0.06] text-muted"}`} title="AI Assistant"><Sparkles className="w-[18px] h-[18px]" /></button>
            <button onClick={() => setShowSearch(true)} className="p-2 rounded-lg hover:bg-foreground/[0.06] text-muted transition flex-shrink-0" title="Search messages"><Search className="w-[18px] h-[18px]" /></button>
            <button onClick={() => startCall("voice")} className="hidden sm:flex p-2 rounded-lg hover:bg-foreground/[0.06] text-muted transition flex-shrink-0" title="Voice call"><Phone className="w-[18px] h-[18px]" /></button>
            <button onClick={() => startCall("video")} className="p-2 rounded-lg hover:bg-foreground/[0.06] text-muted transition flex-shrink-0" title="Video call"><Video className="w-[18px] h-[18px]" /></button>
            
            <div className="relative flex-shrink-0">
              <button onClick={() => setShowHeaderMenu((v) => !v)} className="p-2 rounded-lg hover:bg-foreground/[0.06] text-muted transition" title="More"><MoreHorizontal className="w-[18px] h-[18px]" /></button>
              {showHeaderMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowHeaderMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-2xl py-1 z-50 overflow-hidden">
                    <button onClick={() => { setShowHeaderMenu(false); setShowSearch(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-foreground/[0.06] text-left transition"><Search className="w-4 h-4 text-muted" /> Search messages</button>
                    <button onClick={markAsUnread} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-foreground/[0.06] text-left transition"><Mail className="w-4 h-4 text-muted" /> Mark as unread</button>
                    <button onClick={() => { setShowHeaderMenu(false); toast.success("Notifications muted"); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-foreground/[0.06] text-left transition"><BellOff className="w-4 h-4 text-muted" /> Mute notifications</button>
                    <div className="my-1 border-t border-border" />
                    <button onClick={deleteConversation} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-red-500/10 text-red-500 text-left transition"><Trash2 className="w-4 h-4" /> Delete conversation</button>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Pinned Banner */}
          {pinnedMessages.length > 0 && (
            <button onClick={() => setShowPinnedList(true)} className="w-full flex items-center gap-2 px-3 md:px-5 py-2 border-b border-border bg-yellow-500/[0.04] hover:bg-yellow-500/[0.08] transition text-left flex-shrink-0">
              <Pin className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              <span className="text-[12px] font-medium text-foreground/80 truncate flex-1">
                <span className="text-yellow-500 font-semibold">{pinnedMessages.length} {pinnedMessages.length === 1 ? "pin" : "pins"}</span>
                {" — "}{pinnedMessages[0]?.content || "📎 Attachment"}
              </span>
              <span className="text-[11px] text-muted flex-shrink-0">View all</span>
            </button>
          )}
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 relative" ref={scrollContainerRef} onScroll={handleScroll}>
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4"><MessageSquare className="w-8 h-8 text-emerald-500" /></div>
                <p className="text-[15px] font-semibold text-foreground mb-1">No messages yet</p>
                <p className="text-[13px] text-muted max-w-xs leading-relaxed">Say hello to {active.displayName}. Your conversation starts here.</p>
              </div>
            ) : (
              <div className="space-y-0.5 max-w-3xl mx-auto pb-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const prev = messages[idx - 1];
                    const next = messages[idx + 1];
                    const isMe = msg.userId === session?.user?.id;
                    const reactions = parseReactions(msg.reactions);
                    const reactionKeys = Object.keys(reactions);
                    const isImage = msg.fileType?.startsWith("image/");
                    const isAudio = msg.fileType?.startsWith("audio/");
                    const replyCount = msg.replyCount || 0;
                    const grouped = shouldGroup(prev, msg);
                    const groupedWithNext = next ? shouldGroup(msg, next) : false;
                    const showDateDivider = !prev || !sameDay(prev.createdAt, msg.createdAt);

                    return (
                      <div key={msg.id}>
                        {showDateDivider && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted/80 px-2 py-0.5 rounded-full bg-foreground/[0.04]">{formatDayLabel(msg.createdAt)}</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                        )}

                        <motion.div
                          id={`msg-${msg.id}`}
                          initial={prefersReducedMotion ? {} : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`flex gap-2.5 group relative ${grouped ? "mt-0.5" : "mt-3"} ${isMe ? "flex-row-reverse" : ""}`}
                          onTouchStart={() => handleMessageTouchStart(msg)}
                          onTouchEnd={handleMessageTouchEnd}
                          onTouchMove={handleMessageTouchEnd}
                          onClick={handleMessageClick}
                        >
                          <div className="w-8 flex-shrink-0">
                            {!grouped && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[11px] font-semibold overflow-hidden text-white">
                                {msg.user?.image ? <img src={msg.user.image} alt="" className="w-full h-full object-cover" /> : msg.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>

                          <div className={`flex-1 min-w-0 flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {!grouped && (
                              <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                <span className="text-[13px] font-semibold tracking-tight text-foreground">{isMe ? "You" : msg.user?.name || "User"}</span>
                                <span className="text-[11px] text-muted/70">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                            )}

                            {/* Image */}
                            {msg.fileUrl && isImage && (
                              <div className={`mt-0.5 ${isMe ? "ml-auto" : ""}`}>
                                <button type="button" onClick={() => setPreviewImage(msg.fileUrl!)} className="block rounded-2xl overflow-hidden border border-border hover:border-emerald-500/40 transition">
                                  <img src={msg.fileUrl} alt={msg.fileName || "attachment"} className="max-w-[260px] md:max-w-sm max-h-80 object-cover" />
                                </button>
                              </div>
                            )}

                            {/* Audio / Voice Note */}
                            {msg.fileUrl && isAudio && (
                              <div className={`mt-0.5 w-full max-w-[300px] ${isMe ? "ml-auto" : ""}`}>
                                <audio controls src={msg.fileUrl} className="w-full h-10 rounded-full outline-none" style={{ filter: "invert(10%)" }} />
                              </div>
                            )}

                            {/* File */}
                            {msg.fileUrl && !isImage && !isAudio && (
                              <a href={msg.fileUrl} download={msg.fileName || "file"} className={`mt-0.5 inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-border bg-foreground/[0.03] hover:bg-foreground/[0.06] transition max-w-sm ${isMe ? "ml-auto" : ""}`}>
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-emerald-500" /></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium truncate">{msg.fileName || "File"}</p>
                                  <p className="text-[11px] text-muted">Click to download</p>
                                </div>
                                <Download className="w-4 h-4 text-muted flex-shrink-0" />
                              </a>
                            )}

                            {editingMessageId === msg.id ? (
                              <div className="mt-1 w-full max-w-md space-y-2">
                                <textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} rows={2} autoFocus className="w-full rounded-xl border border-emerald-500/50 bg-foreground/[0.04] px-3 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition resize-none" />
                                <div className={`flex gap-2 ${isMe ? "justify-end" : ""}`}>
                                  <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition">Save</button>
                                  <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg bg-foreground/[0.06] hover:bg-foreground/10 text-xs font-semibold transition">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              msg.content && (
                                <div className={`relative max-w-[85%] md:max-w-[75%] ${isMe ? "bg-emerald-500/[0.12] text-foreground rounded-2xl rounded-tr-md" : "bg-foreground/[0.04] text-foreground rounded-2xl rounded-tl-md"} px-3.5 py-2 ${groupedWithNext ? (isMe ? "rounded-br-md" : "rounded-bl-md") : ""}`}>
                                  <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">
                                    {renderContent(msg.content)}
                                    {msg.editedAt && <span className="text-[10px] text-muted ml-2 italic">(edited)</span>}
                                  </p>
                                </div>
                              )
                            )}

                            {reactionKeys.length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? "justify-end" : ""}`}>
                                {reactionKeys.map((emoji) => {
                                  const users: string[] = reactions[emoji];
                                  const mine = users.includes(session?.user?.id || "");
                                  return (
                                    <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className={`px-1.5 py-0.5 rounded-full border text-[11px] transition ${mine ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300" : "bg-foreground/[0.04] border-border hover:bg-foreground/[0.08]"}`}>
                                      {emoji} {users.length}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {replyCount > 0 && (
                              <button onClick={() => setOpenThread(msg)} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-500 hover:text-emerald-400 transition">
                                <MessageCircle className="w-3.5 h-3.5" /> {replyCount} {replyCount === 1 ? "reply" : "replies"}
                              </button>
                            )}

                            {isMe && !groupedWithNext && (
                              <div className="flex items-center gap-1 mt-1 text-[10.5px] text-muted/70">
                                {msg.pending ? (
                                  <><Clock className="w-3 h-3" /><span>Sending...</span></>
                                ) : msg.readAt ? (
                                  <><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /><span>Read</span></>
                                ) : (
                                  <><Check className="w-3.5 h-3.5" /><span>Sent</span></>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Hover toolbar with Quick Emojis */}
                          <div className={`hidden md:flex absolute top-0 ${isMe ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} opacity-0 group-hover:opacity-100 transition items-center gap-0.5 rounded-lg border border-border bg-card shadow-sm px-1 py-0.5 z-10`}>
                            {/* Quick Emoji Bar */}
                            <div className="flex gap-0.5 border-r border-border pr-1 mr-0.5">
                              {QUICK_EMOJIS.slice(0, 3).map(emoji => (
                                <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="p-1 rounded hover:bg-foreground/[0.06] transition text-[13px]" title="React">
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)} className="p-1 rounded hover:bg-foreground/[0.06] transition" title="More reactions"><Smile className="w-3.5 h-3.5 text-muted" /></button>
                            <button onClick={() => { setForwardMsg(msg); setActionSheetMsg(null); }} className="p-1 rounded hover:bg-foreground/[0.06] transition" title="Forward"><Forward className="w-3.5 h-3.5 text-muted" /></button>
                            <button onClick={() => setOpenThread(msg)} className="p-1 rounded hover:bg-foreground/[0.06] transition" title="Reply"><MessageCircle className="w-3.5 h-3.5 text-muted" /></button>
                            <button onClick={() => togglePin(msg)} className="p-1 rounded hover:bg-foreground/[0.06] transition" title={pinnedMessages.some((p) => p.id === msg.id) ? "Unpin" : "Pin"}>
                              <Pin className={`w-3.5 h-3.5 ${pinnedMessages.some((p) => p.id === msg.id) ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                            </button>
                            <button onClick={() => setActionSheetMsg(msg)} className="p-1 rounded hover:bg-foreground/[0.06] transition" title="More"><MoreHorizontal className="w-3.5 h-3.5 text-muted" /></button>
                          </div>

                          {emojiPickerFor === msg.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setEmojiPickerFor(null)} />
                              <div className={`absolute ${isMe ? "right-0" : "left-0"} top-full mt-1 p-2 rounded-xl bg-card border border-border shadow-2xl z-50 w-[280px]`}>
                                <div className="grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto">
                                  {FULL_EMOJIS.map((emoji) => (
                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="w-8 h-8 rounded hover:bg-foreground/[0.08] transition text-base flex items-center justify-center">
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>

                {otherUserTyping && (
                  <motion.div initial={prefersReducedMotion ? {} : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 mt-3">
                    <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1 h-1 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1 h-1 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                    <div className="bg-foreground/[0.04] rounded-2xl rounded-tl-md px-3.5 py-2 text-[12.5px] text-muted italic">{active.isGroup ? "Someone is typing…" : `${active.otherUser?.name || "They"} are typing…`}</div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Scroll to bottom pill */}
          <AnimatePresence>
            {showScrollDown && (
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                onClick={scrollToBottom}
                className="absolute bottom-[90px] right-6 md:right-10 p-2.5 rounded-full bg-card border border-border shadow-xl text-muted hover:text-foreground hover:bg-foreground/[0.04] transition z-20"
                title="Scroll to latest"
              >
                <ArrowDown className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Composer */}
          <form onSubmit={sendMessage} className="border-t border-border p-3 md:p-4 flex-shrink-0 relative z-10 bg-background">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-1.5 rounded-2xl border border-border bg-foreground/[0.025] focus-within:ring-1 focus-within:ring-emerald-500/40 focus-within:border-emerald-500/40 transition px-2 py-1.5">
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || isRecording} className="p-2 rounded-lg hover:bg-foreground/[0.06] transition flex-shrink-0" title="Attach">
                  {uploading ? <Loader2 className="w-[18px] h-[18px] animate-spin text-muted" /> : <Paperclip className="w-[18px] h-[18px] text-muted" />}
                </button>

                <button type="button" onClick={toggleRecording} className={`p-2 rounded-lg transition flex-shrink-0 ${isRecording ? "bg-red-500/20 text-red-500 animate-pulse" : "hover:bg-foreground/[0.06] text-muted"}`} title={isRecording ? "Stop recording" : "Record voice note"}>
                  <Mic className="w-[18px] h-[18px]" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (typingChannelRef.current && session?.user?.id && activeId) {
                      if (!isCurrentlyTypingRef.current) {
                        isCurrentlyTypingRef.current = true;
                        typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: session.user.id, userName: session.user.name || "Someone" } });
                      }
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        isCurrentlyTypingRef.current = false;
                        typingChannelRef.current?.send({ type: "broadcast", event: "stop-typing", payload: { userId: session.user.id } });
                      }, TYPING_TIMEOUT);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // @ts-ignore
                      sendMessage(e);
                    }
                  }}
                  rows={1}
                  placeholder={isRecording ? "Recording voice note..." : `Message ${active.displayName}…`}
                  disabled={isRecording}
                  className="flex-1 min-w-0 bg-transparent px-1 py-2 text-[14.5px] text-foreground placeholder:text-muted focus:outline-none resize-none max-h-[120px] overflow-y-auto disabled:opacity-50"
                  style={{ minHeight: "36px" }}
                />

                <button type="button" onClick={() => setEmojiPickerFor(emojiPickerFor === "__composer__" ? null : "__composer__")} className="p-2 rounded-lg hover:bg-foreground/[0.06] transition flex-shrink-0" title="Emoji">
                  <Smile className="w-[18px] h-[18px] text-muted" />
                </button>

                <button type="submit" disabled={(!input.trim() && !isRecording) || sending} className="rounded-full bg-emerald-500 text-white w-9 h-9 flex items-center justify-center hover:bg-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0" title="Send">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {emojiPickerFor === "__composer__" && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setEmojiPickerFor(null)} />
                  <div className="absolute bottom-24 md:bottom-20 right-4 md:right-6 p-2 rounded-xl bg-card border border-border shadow-2xl z-50 w-[300px]">
                    <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                      {FULL_EMOJIS.map((emoji) => (
                        <button key={emoji} type="button" onClick={() => { setInput((v) => v + emoji); setEmojiPickerFor(null); }} className="w-8 h-8 rounded hover:bg-foreground/[0.08] transition text-base flex items-center justify-center">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center max-w-sm px-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5"><MessageSquare className="w-10 h-10 text-emerald-500" /></div>
            <h2 className="text-lg font-semibold text-foreground mb-1.5 tracking-tight">Your conversations</h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-5">Select a conversation from the sidebar, or start a new one to begin.</p>
            <button onClick={() => setShowNewDm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition">
              <Plus className="w-4 h-4" /> New conversation
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODALS ===================== */}
      {showGroupCall && activeId && active && (
        <GroupCall conversationId={activeId} conversationName={active.displayName} onClose={() => setShowGroupCall(false)} />
      )}
      {showAIPanel && activeId && (
        <AIPanel conversationId={activeId} conversationName={active?.displayName || "Conversation"} onClose={() => setShowAIPanel(false)} />
      )}
      {openThread && activeId && (
        <ThreadPanel conversationId={activeId} parentMessage={openThread} onClose={() => setOpenThread(null)} onReplyCountChange={handleReplyCountChange} />
      )}

      {/* Image Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition" aria-label="Close"><X className="w-5 h-5" /></button>
            <a href={previewImage} download onClick={(e) => e.stopPropagation()} className="absolute top-4 right-16 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition" aria-label="Download"><Download className="w-5 h-5" /></a>
            <motion.img initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned List */}
      {showPinnedList && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={() => setShowPinnedList(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-[14px] flex items-center gap-2"><Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Pinned messages</h3>
              <button onClick={() => setShowPinnedList(false)} className="p-1 rounded-lg hover:bg-foreground/[0.06] transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {pinnedMessages.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">No pinned messages yet</div>
              ) : (
                pinnedMessages.map((pin) => (
                  <div key={pin.id} className="p-4 border-b border-border/40 hover:bg-foreground/[0.03] transition">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => scrollToMessage(pin.id)}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[12px] font-semibold">{pin.user?.name || "User"}</span>
                          <span className="text-[10px] text-muted">{new Date(pin.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[13px] text-foreground/80 line-clamp-2">{pin.content || "📎 Attachment"}</p>
                      </div>
                      <button onClick={() => togglePin(pin)} className="p-1.5 rounded-lg hover:bg-yellow-500/20 transition flex-shrink-0" title="Unpin"><Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Sheet */}
      <AnimatePresence>
        {actionSheetMsg && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center" onClick={() => setActionSheetMsg(null)}>
            <motion.div
              initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full lg:max-w-sm bg-card border-t lg:border border-border rounded-t-3xl lg:rounded-2xl shadow-2xl overflow-hidden pb-4 lg:pb-0"
            >
              <div className="lg:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="px-5 py-4 border-b border-border">
                <p className="text-[11px] text-muted mb-1">{actionSheetMsg.user?.name || "User"}</p>
                <p className="text-[13px] text-foreground line-clamp-2">{actionSheetMsg.content || "📎 Attachment"}</p>
              </div>
              <div className="px-3 py-2 border-b border-border">
                <div className="flex gap-1 justify-between">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => { toggleReaction(actionSheetMsg.id, emoji); setActionSheetMsg(null); }} className="flex-1 h-12 rounded-xl hover:bg-foreground/[0.06] transition text-2xl active:scale-95">
                      {emoji}
                    </button>
                  ))}
                  <button onClick={() => { setEmojiPickerFor(actionSheetMsg.id); setActionSheetMsg(null); }} className="flex-1 h-12 rounded-xl hover:bg-foreground/[0.06] transition flex items-center justify-center active:scale-95"><Plus className="w-5 h-5 text-muted" /></button>
                </div>
              </div>
              <div className="p-2">
                <button onClick={() => openTaskFromMessage(actionSheetMsg)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/[0.04] transition text-left">
                  <CheckSquare className="w-5 h-5 text-emerald-500" /><span className="text-[13.5px] font-medium">Turn into task</span>
                </button>
                <button onClick={() => { setForwardMsg(actionSheetMsg); setActionSheetMsg(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/[0.04] transition text-left">
                  <Forward className="w-5 h-5 text-muted" /><span className="text-[13.5px] font-medium">Forward message</span>
                </button>
                <button onClick={() => { copyMessage(actionSheetMsg.content); setActionSheetMsg(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/[0.04] transition text-left">
                  <Copy className="w-5 h-5 text-muted" /><span className="text-[13.5px] font-medium">Copy text</span>
                </button>
                <button onClick={() => { setOpenThread(actionSheetMsg); setActionSheetMsg(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/[0.04] transition text-left">
                  <MessageCircle className="w-5 h-5 text-muted" /><span className="text-[13.5px] font-medium">Reply in thread</span>
                </button>
                <button onClick={() => togglePin(actionSheetMsg)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/[0.04] transition text-left">
                  <Pin className={`w-5 h-5 ${pinnedMessages.some((p) => p.id === actionSheetMsg.id) ? "text-yellow-500" : "text-muted"}`} />
                  <span className="text-[13.5px] font-medium">{pinnedMessages.some((p) => p.id === actionSheetMsg.id) ? "Unpin message" : "Pin message"}</span>
                </button>
                {actionSheetMsg.userId === session?.user?.id && actionSheetMsg.content && (
                  <button onClick={() => startEditing(actionSheetMsg)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-foreground/[0.04] transition text-left">
                    <Pencil className="w-5 h-5 text-emerald-500" /><span className="text-[13.5px] font-medium">Edit message</span>
                  </button>
                )}
                {actionSheetMsg.userId === session?.user?.id && (
                  <button onClick={() => deleteMessage(actionSheetMsg.id)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition text-left">
                    <Trash2 className="w-5 h-5 text-red-500" /><span className="text-[13.5px] font-medium text-red-500">Delete message</span>
                  </button>
                )}
              </div>
              <div className="px-3 pt-2 lg:hidden">
                <button onClick={() => setActionSheetMsg(null)} className="w-full py-3 rounded-xl bg-foreground/[0.06] hover:bg-foreground/10 transition text-sm font-medium">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forward Modal */}
      <AnimatePresence>
        {forwardMsg && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setForwardMsg(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-[14px] flex items-center gap-2"><Forward className="w-4 h-4 text-emerald-500" /> Forward to...</h3>
                <button onClick={() => setForwardMsg(null)} className="p-1 rounded-lg hover:bg-foreground/[0.06] transition"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.map(c => (
                  <button key={c.id} onClick={() => forwardMessage(c.id)} className="w-full text-left p-3 rounded-xl hover:bg-foreground/[0.04] transition flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      {c.isGroup ? <Users className="w-4 h-4 text-emerald-500" /> : <MessageSquare className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <span className="text-[13px] font-medium truncate">{c.displayName}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {taskFromMessage && (
          <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center" onClick={() => !creatingTask && setTaskFromMessage(null)}>
            <motion.div
              initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full lg:max-w-lg bg-card border-t lg:border border-border rounded-t-3xl lg:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="lg:hidden flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                <h3 className="font-semibold text-[14px] flex items-center gap-2"><CheckSquare className="w-4 h-4 text-emerald-500" /> Create task</h3>
                <button onClick={() => setTaskFromMessage(null)} disabled={creatingTask} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] transition disabled:opacity-50"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-xl bg-foreground/[0.04] border border-border p-3">
                  <p className="text-[10px] text-muted mb-1 uppercase tracking-wider">From message</p>
                  <p className="text-[12px] text-foreground/80 line-clamp-2">{taskFromMessage.content || "📎 Attachment"}</p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-2 text-foreground/80">Title</label>
                  <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus className="w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" placeholder="What needs to be done?" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-2 text-foreground/80">Description</label>
                  <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} className="w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-3 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition resize-none" placeholder="Add details…" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-2 text-foreground/80">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITIES.map((p) => (
                      <button key={p.value} type="button" onClick={() => setTaskForm({ ...taskForm, priority: p.value as any })} className={`py-2.5 rounded-xl border text-[12px] font-medium transition ${taskForm.priority === p.value ? "border-emerald-500/50 bg-emerald-500/10 " + p.color : "border-border bg-foreground/[0.04] hover:bg-foreground/[0.08] text-muted"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-2 text-foreground/80">Due date (optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full rounded-xl border border-border bg-foreground/[0.04] pl-10 pr-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border flex-shrink-0 flex gap-2 pb-6 lg:pb-4">
                <button onClick={() => setTaskFromMessage(null)} disabled={creatingTask} className="flex-1 py-3 rounded-xl border border-border hover:bg-foreground/[0.04] transition text-[13px] font-medium disabled:opacity-50">Cancel</button>
                <button onClick={createTaskFromMessage} disabled={creatingTask || !taskForm.title.trim()} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {creatingTask ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create task"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New DM Modal */}
      {showNewDm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={() => { setShowNewDm(false); setSelectedUsers([]); setSearch(""); setSearchResults([]); setGroupName(""); }}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-[14px]">{selectedUsers.length > 1 ? `New group (${selectedUsers.length})` : "New message"}</h3>
              <button type="button" onClick={(e) => { e.stopPropagation(); setShowNewDm(false); setSelectedUsers([]); setSearch(""); setSearchResults([]); setGroupName(""); }} className="p-1 rounded-lg hover:bg-foreground/[0.06] transition"><X className="w-4 h-4" /></button>
            </div>
            {selectedUsers.length > 0 && (
              <div className="p-3 border-b border-border flex flex-wrap gap-2">
                {selectedUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11.5px]">
                    <span className="truncate max-w-[100px]">{u.name || u.email}</span>
                    <button onClick={() => toggleUser(u)}><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            {selectedUsers.length > 1 && (
              <div className="p-3 border-b border-border">
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name (optional)" className="w-full rounded-lg border border-border bg-foreground/[0.04] px-3 py-2 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
              </div>
            )}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" autoFocus className="w-full rounded-xl border border-border bg-foreground/[0.04] pl-10 pr-4 py-2.5 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {searching ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted text-[13px]">{search ? "No users found" : "Start typing to search"}</div>
              ) : (
                searchResults.map((user) => {
                  const selected = selectedUsers.some((u) => u.id === user.id);
                  return (
                    <div key={user.id} role="button" tabIndex={0} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleUser(user); }} className={`w-full text-left p-3 hover:bg-foreground/[0.04] transition flex items-center gap-3 border-b border-border/40 cursor-pointer select-none ${selected ? "bg-emerald-500/10" : ""}`}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[13px] font-semibold flex-shrink-0 overflow-hidden text-white pointer-events-none">
                        {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0 pointer-events-none">
                        <p className="text-[13px] font-medium truncate">{user.name || user.email}</p>
                        <p className="text-[11.5px] text-muted truncate">{user.email}</p>
                      </div>
                      {selected && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
                    </div>
                  );
                })
              )}
            </div>
            {selectedUsers.length > 0 && (
              <div className="p-4 border-t border-border">
                <button onClick={startConversation} className="w-full rounded-xl bg-emerald-500 text-white py-3 font-semibold text-[13px] hover:bg-emerald-600 transition">
                  {selectedUsers.length > 1 ? `Create group with ${selectedUsers.length} people` : `Chat with ${selectedUsers[0].name || selectedUsers[0].email}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={() => { setShowSearch(false); setMsgSearch(""); setSearchMsgResults([]); }}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-4 h-4 text-muted flex-shrink-0" />
              <input type="text" value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)} placeholder="Search messages…" autoFocus className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none text-[14px]" />
              <button type="button" onClick={() => { setShowSearch(false); setMsgSearch(""); setSearchMsgResults([]); }} className="p-1 rounded-lg hover:bg-foreground/[0.06] transition flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {msgSearch.length < 2 ? (
                <div className="text-center py-8 px-4 text-muted text-[13px]">Type at least 2 characters to search</div>
              ) : searchingMsgs ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>
              ) : searchMsgResults.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted text-[13px]">No messages found for &quot;{msgSearch}&quot;</div>
              ) : (
                searchMsgResults.map((msg) => (
                  <div key={msg.id} onMouseDown={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      const el = document.getElementById(`msg-${msg.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.classList.add("ring-2", "ring-emerald-500", "rounded-lg");
                        setTimeout(() => { el.classList.remove("ring-2", "ring-emerald-500", "rounded-lg"); }, 2000);
                      }
                      setShowSearch(false); setMsgSearch(""); setSearchMsgResults([]);
                    }}
                    className="w-full text-left p-3 hover:bg-foreground/[0.04] transition border-b border-border/40 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0 text-white pointer-events-none">
                        {msg.user?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-[11.5px] font-medium truncate pointer-events-none">{msg.user?.name || "User"}</span>
                      <span className="text-[10px] text-muted pointer-events-none">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[13px] text-foreground/80 line-clamp-2 pointer-events-none">{msg.content}</p>
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
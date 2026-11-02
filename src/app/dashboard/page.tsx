"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, CheckSquare, FileText, Users, ArrowRight, ArrowUpRight,
  Loader2, Sparkles, TrendingUp, Plus, Video, Bell, Calendar, Flame,
  Activity, Zap, Command, CheckCircle2, Database, Target, Clock,
  BarChart3, ChevronRight, PieChart, AlertCircle
} from "lucide-react";

type Stats = {
  conversations: number;
  tasks: number;
  documents: number;
  unreadNotifications: number;
  unreadMessages: number;
  urgentTasks: number;
  dueToday: number;
};

type Conversation = {
  id: string;
  isGroup?: boolean;
  name?: string | null;
  displayName?: string;
  otherUser: { id?: string; name: string | null; email: string; image: string | null; } | null;
  lastMessage: { content: string; createdAt: string } | null;
  updatedAt: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assigneeId: string | null;
  assignee?: { id: string; name: string | null; image: string | null; } | null;
};

type Document = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  lastSeenAt: string | null;
};

type Activity = {
  id: string;
  type: "message" | "task" | "doc";
  title: string;
  userName: string;
  createdAt: string;
};

function isOnline(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return email[0].toUpperCase();
}

const PRIORITY_COLORS: Record<string, { dot: string; label: string; text: string }> = {
  URGENT: { dot: "bg-red-500", label: "Urgent", text: "text-red-500" },
  HIGH: { dot: "bg-orange-500", label: "High", text: "text-orange-500" },
  MEDIUM: { dot: "bg-blue-500", label: "Medium", text: "text-blue-500" },
  LOW: { dot: "bg-slate-500", label: "Low", text: "text-slate-500" },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    conversations: 0, tasks: 0, documents: 0, unreadNotifications: 0,
    unreadMessages: 0, urgentTasks: 0, dueToday: 0,
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [teamOnline, setTeamOnline] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/conversations", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
      fetch("/api/tasks", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
      fetch("/api/documents", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
      fetch("/api/notifications", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ unreadCount: 0 })),
      fetch("/api/users/team", { cache: "no-store" }).then((r) => r.json()).catch(() => []),
    ])
      .then(([convos, tasksData, docs, notifs, users]) => {
        const c = Array.isArray(convos) ? convos : [];
        const t = Array.isArray(tasksData) ? tasksData : [];
        const d = Array.isArray(docs) ? docs : [];
        const u = Array.isArray(users) ? users : [];

        const unreadMsgs = c.filter((convo: Conversation) => convo.lastMessage && Date.now() - new Date(convo.lastMessage.createdAt).getTime() < 24 * 60 * 60 * 1000).length;
        const urgent = t.filter((task: Task) => task.status !== "DONE" && task.priority === "URGENT").length;
        
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const due = t.filter((task: Task) => {
          if (!task.dueDate || task.status === "DONE") return false;
          return new Date(task.dueDate) <= today;
        }).length;

        setConversations(c.slice(0, 5));
        setAllTasks(t);
        setDocuments(d.sort((a: Document, b: Document) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4));
        setTeamOnline(u.filter((m: Member) => isOnline(m.lastSeenAt)).slice(0, 8));

        setStats({
          conversations: c.length,
          tasks: t.filter((task: Task) => task.status !== "DONE").length,
          documents: d.length,
          unreadNotifications: notifs.unreadCount || 0,
          unreadMessages: unreadMsgs,
          urgentTasks: urgent,
          dueToday: due,
        });

        const feed: Activity[] = [];
        c.slice(0, 3).forEach((convo: Conversation) => {
          if (convo.lastMessage) {
            feed.push({ id: `msg-${convo.id}`, type: "message", title: `New message in ${convo.displayName || "chat"}`, userName: convo.otherUser?.name || "Someone", createdAt: convo.lastMessage.createdAt });
          }
        });
        t.slice(0, 3).forEach((task: Task) => {
          feed.push({ id: `task-${task.id}`, type: "task", title: `Task: ${task.title}`, userName: "You", createdAt: task.createdAt });
        });
        d.slice(0, 2).forEach((doc: Document) => {
          feed.push({ id: `doc-${doc.id}`, type: "doc", title: `Updated: ${doc.title}`, userName: "You", createdAt: doc.updatedAt });
        });
        setActivity(feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const myFocusTasks = useMemo(() => {
    return allTasks
      .filter(t => t.assigneeId === session?.user?.id && t.status !== "DONE")
      .sort((a, b) => {
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 99);
      })
      .slice(0, 5);
  }, [allTasks, session?.user?.id]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return allTasks
      .filter(t => t.dueDate && t.status !== "DONE" && new Date(t.dueDate) >= now && new Date(t.dueDate) <= next48h)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 4);
  }, [allTasks]);

  const taskBreakdown = useMemo(() => {
    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    allTasks.forEach(t => { if (counts[t.status as keyof typeof counts] !== undefined) counts[t.status as keyof typeof counts]++; });
    const total = allTasks.length || 1;
    return [
      { label: "To Do", count: counts.TODO, pct: (counts.TODO / total) * 100, color: "bg-slate-500" },
      { label: "In Progress", count: counts.IN_PROGRESS, pct: (counts.IN_PROGRESS / total) * 100, color: "bg-emerald-500" },
      { label: "Review", count: counts.REVIEW, pct: (counts.REVIEW / total) * 100, color: "bg-yellow-500" },
      { label: "Done", count: counts.DONE, pct: (counts.DONE / total) * 100, color: "bg-blue-500" },
    ];
  }, [allTasks]);

  const subtitle = (() => {
    const parts: string[] = [];
    if (stats.dueToday > 0) parts.push(`${stats.dueToday} task${stats.dueToday === 1 ? "" : "s"} due`);
    if (stats.unreadMessages > 0) parts.push(`${stats.unreadMessages} active chat${stats.unreadMessages === 1 ? "" : "s"}`);
    if (stats.unreadNotifications > 0) parts.push(`${stats.unreadNotifications} new notification${stats.unreadNotifications === 1 ? "" : "s"}`);
    return parts.length > 0 ? parts.join(" • ") : "Here's what's happening in your workspace today.";
  })();

  const statCards = [
    { label: "Active chats", value: stats.conversations, icon: MessageSquare, href: "/dashboard/chat", badge: stats.unreadMessages > 0 ? `${stats.unreadMessages} recent` : null },
    { label: "Open tasks", value: stats.tasks, icon: CheckSquare, href: "/dashboard/tasks", badge: stats.urgentTasks > 0 ? `${stats.urgentTasks} urgent` : null },
    { label: "Documents", value: stats.documents, icon: FileText, href: "/dashboard/docs", badge: null },
    { label: "Notifications", value: stats.unreadNotifications, icon: Bell, href: "/dashboard", badge: stats.unreadNotifications > 0 ? "unread" : null },
  ];

  const quickActions = [
    { label: "New message", icon: MessageSquare, href: "/dashboard/chat" },
    { label: "New task", icon: Plus, href: "/dashboard/tasks" },
    { label: "New document", icon: FileText, href: "/dashboard/docs" },
    { label: "Start call", icon: Video, href: "/dashboard/chat" },
    { label: "Invite team", icon: Users, href: "/dashboard/team" },
    { label: "View analytics", icon: TrendingUp, href: "/dashboard/analytics" },
  ];

  const chartData = [40, 70, 45, 90, 65, 85, 100];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* ===== GREETING ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2 tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-muted text-sm md:text-base font-medium">{subtitle}</p>
        </div>
        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl font-semibold text-sm hover:opacity-90 transition shadow-sm">
          <Command className="w-4 h-4" /> Command Menu (⌘K)
        </button>
      </motion.div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={stat.href} className="group block rounded-2xl border border-border bg-card p-4 md:p-5 hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4 group-hover:scale-110">
                <stat.icon className="w-24 h-24" />
              </div>
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground/[0.06] text-muted border border-border/50">
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-1 tracking-tight relative z-10">{stat.value}</p>
              <p className="text-xs md:text-sm font-medium text-muted relative z-10">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ===== MAIN GRID (3 Cols) ===== */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        
        {/* LEFT COL: Recent Chats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> Recent chats
            </h2>
            <Link href="/dashboard/chat" className="text-[12px] font-medium text-emerald-500 hover:text-emerald-400 flex items-center gap-1 group">
              View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
          {conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations yet" desc="Start chatting with your team" cta="Start a chat" href="/dashboard/chat" />
          ) : (
            <div className="space-y-1 flex-1">
              {conversations.map((c) => {
                const displayName = c.isGroup ? c.displayName || c.name || "Group" : c.otherUser?.name || c.otherUser?.email || "Unknown";
                const initial = c.isGroup ? "#" : c.otherUser?.name?.[0]?.toUpperCase() || "?";
                const online = isOnline(c.otherUser?.lastSeenAt);
                return (
                  <Link key={c.id} href="/dashboard/chat" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/[0.03] transition group">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[13px] font-semibold overflow-hidden">
                        {c.otherUser?.image ? <img src={c.otherUser.image} alt="" className="w-full h-full object-cover" /> : initial}
                      </div>
                      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium truncate text-foreground">{displayName}</p>
                      <p className="text-[12px] text-muted truncate">{c.lastMessage?.content || "No messages yet"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {c.lastMessage && <span className="text-[10.5px] font-medium text-muted/70">{timeAgo(c.lastMessage.createdAt)}</span>}
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* RIGHT COL: My Focus Tasks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" /> My Focus
            </h2>
            <Link href="/dashboard/tasks" className="text-[12px] font-medium text-orange-500 hover:text-orange-400 flex items-center gap-1 group">
              All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
          {myFocusTasks.length === 0 ? (
            <EmptyState icon={CheckSquare} title="You're all caught up" desc="No tasks assigned to you" cta="View tasks" href="/dashboard/tasks" />
          ) : (
            <div className="space-y-2">
              {myFocusTasks.map((t) => {
                const priority = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.LOW;
                const isOverdue = t.dueDate && new Date(t.dueDate).getTime() < Date.now();
                return (
                  <Link key={t.id} href="/dashboard/tasks" className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-foreground/[0.03] transition group">
                    <div className={`w-1.5 h-1.5 rounded-full ${priority.dot} flex-shrink-0 mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10.5px] font-semibold ${priority.text}`}>{priority.label}</span>
                        {t.dueDate && (
                          <span className={`text-[10.5px] flex items-center gap-1 ${isOverdue ? "text-red-500 font-semibold" : "text-muted"}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(t.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== ANALYTICS & BOTTOM GRID ===== */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        
        {/* Velocity Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" /> Velocity
              </h2>
              <p className="text-[11px] text-muted mt-0.5">Tasks completed this week</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">+12.5%</span>
          </div>
          <div className="flex items-end justify-between h-32 gap-2">
            {chartData.map((val, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="relative w-full flex justify-center h-full items-end">
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-semibold px-2 py-0.5 rounded">{val}</div>
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ delay: 0.3 + (i * 0.1), type: "spring" }}
                    className="w-full max-w-[24px] bg-emerald-500/20 rounded-t-sm group-hover:bg-emerald-500 transition-colors relative overflow-hidden"
                  >
                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-sm" style={{ height: `${val}%` }} />
                  </motion.div>
                </div>
                <span className="text-[10px] font-medium text-muted">{days[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Recent activity
            </h2>
            <span className="text-[11px] font-medium text-muted bg-foreground/[0.04] px-2 py-1 rounded-md">Last 24 hours</span>
          </div>
          {activity.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted">No activity yet. Start using Nexus!</div>
          ) : (
            <div className="relative pl-3 space-y-5 before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-border">
              {activity.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4">
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-card ${
                      item.type === "message" ? "bg-blue-500/10 text-blue-500" : item.type === "task" ? "bg-orange-500/10 text-orange-500" : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                    {item.type === "message" ? <MessageSquare className="w-3.5 h-3.5" /> : item.type === "task" ? <CheckSquare className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{item.userName} • {timeAgo(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== TASK BREAKDOWN & UPCOMING ===== */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Task Breakdown (Donut style bar) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-emerald-500" /> Task Breakdown
          </h2>
          <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-foreground/[0.05]">
            {taskBreakdown.map((t, i) => (
              <div key={i} className={`h-full ${t.color}`} style={{ width: `${t.pct}%` }} />
            ))}
          </div>
          <div className="space-y-2">
            {taskBreakdown.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${t.color}`} />
                  <span className="text-muted">{t.label}</span>
                </div>
                <span className="font-semibold">{t.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" /> Upcoming Deadlines
            </h2>
            <span className="text-[11px] font-medium text-muted bg-foreground/[0.04] px-2 py-1 rounded-md">Next 48h</span>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-6 text-[13px] text-muted">No deadlines in the next 48 hours.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {upcomingDeadlines.map(t => (
                <Link key={t.id} href="/dashboard/tasks" className="flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:bg-foreground/[0.03] transition">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{t.title}</p>
                    <p className="text-[11px] font-semibold text-orange-500 mt-1">
                      Due {new Date(t.dueDate!).toLocaleDateString("en", { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== QUICK ACTIONS & STORAGE ===== */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
          <h2 className="text-[15px] font-semibold tracking-tight mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Quick actions
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="group rounded-2xl border border-border bg-card p-3 md:p-4 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-foreground/[0.04] text-foreground flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all">
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="text-[11.5px] font-semibold text-foreground leading-tight">{action.label}</p>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-emerald-500" /> Workspace Storage
            </h2>
            <p className="text-[12px] text-muted">Your team is using 24.5 GB of 100 GB</p>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-foreground">24.5% Used</span>
              <span className="text-muted">75.5 GB Free</span>
            </div>
            <div className="w-full h-2.5 bg-foreground/[0.06] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: "24.5%" }} transition={{ delay: 0.6, duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
            </div>
          </div>
          <Link href="/dashboard/settings" className="mt-4 text-[12px] font-semibold text-emerald-500 hover:text-emerald-400 flex items-center justify-between group">
            Upgrade storage <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </motion.div>
      </div>

    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta, href }: { icon: any; title: string; desc: string; cta: string; href: string; }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 h-full">
      <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-border/50 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted" />
      </div>
      <p className="text-[14px] font-semibold text-foreground mb-1">{title}</p>
      <p className="text-[12px] text-muted mb-4">{desc}</p>
      <Link href={href} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition shadow-sm">
        {cta} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckSquare,
  FileText,
  Users,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  Plus,
  Video,
  Bell,
  Calendar,
  Flame,
  Activity,
  Zap,
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
  otherUser: {
    id?: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
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
  if (name) {
    return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  }
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
    conversations: 0,
    tasks: 0,
    documents: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    urgentTasks: 0,
    dueToday: 0,
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [teamOnline, setTeamOnline] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/conversations", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/tasks", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/documents", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ unreadCount: 0 })),
      fetch("/api/users/search?q=a", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([convos, tasksData, docs, notifs, users]) => {
        const c = Array.isArray(convos) ? convos : [];
        const t = Array.isArray(tasksData) ? tasksData : [];
        const d = Array.isArray(docs) ? docs : [];
        const u = Array.isArray(users) ? users : [];

        // Calculate unread (conversations with recent messages, rough estimate)
        const unreadMsgs = c.filter(
          (convo: Conversation) =>
            convo.lastMessage &&
            Date.now() - new Date(convo.lastMessage.createdAt).getTime() <
              24 * 60 * 60 * 1000
        ).length;

        const urgent = t.filter(
          (task: Task) =>
            task.status !== "DONE" && task.priority === "URGENT"
        ).length;

        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const due = t.filter((task: Task) => {
          if (!task.dueDate || task.status === "DONE") return false;
          const dueDate = new Date(task.dueDate);
          return dueDate <= today;
        }).length;

        setConversations(c.slice(0, 5));
        setTasks(
          t
            .filter((task: Task) => task.status !== "DONE")
            .sort((a: Task, b: Task) => {
              const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
              return (
                (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) -
                (priorityOrder[b.priority as keyof typeof priorityOrder] || 99)
              );
            })
            .slice(0, 6)
        );
        setDocuments(
          d
            .sort(
              (a: Document, b: Document) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            .slice(0, 4)
        );
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

        // Build a simple activity feed
        const feed: Activity[] = [];
        c.slice(0, 3).forEach((convo: Conversation) => {
          if (convo.lastMessage) {
            feed.push({
              id: `msg-${convo.id}`,
              type: "message",
              title: `New message in ${convo.displayName || "chat"}`,
              userName: convo.otherUser?.name || "Someone",
              createdAt: convo.lastMessage.createdAt,
            });
          }
        });
        t.slice(0, 3).forEach((task: Task) => {
          feed.push({
            id: `task-${task.id}`,
            type: "task",
            title: `Task: ${task.title}`,
            userName: "You",
            createdAt: task.createdAt,
          });
        });
        d.slice(0, 2).forEach((doc: Document) => {
          feed.push({
            id: `doc-${doc.id}`,
            type: "doc",
            title: `Updated: ${doc.title}`,
            userName: "You",
            createdAt: doc.updatedAt,
          });
        });
        setActivity(
          feed
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 6)
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const subtitle = (() => {
    const parts: string[] = [];
    if (stats.dueToday > 0)
      parts.push(`${stats.dueToday} task${stats.dueToday === 1 ? "" : "s"} due`);
    if (stats.unreadMessages > 0)
      parts.push(`${stats.unreadMessages} active chat${stats.unreadMessages === 1 ? "" : "s"}`);
    if (stats.unreadNotifications > 0)
      parts.push(`${stats.unreadNotifications} new notification${stats.unreadNotifications === 1 ? "" : "s"}`);
    return parts.length > 0
      ? parts.join(" • ")
      : "Here's what's happening in your workspace today.";
  })();

  const statCards = [
    {
      label: "Active chats",
      value: stats.conversations,
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "from-blue-500 to-blue-600",
      badge: stats.unreadMessages > 0 ? `${stats.unreadMessages} recent` : null,
    },
    {
      label: "Open tasks",
      value: stats.tasks,
      icon: CheckSquare,
      href: "/dashboard/tasks",
      color: "from-green-500 to-green-600",
      badge: stats.urgentTasks > 0 ? `${stats.urgentTasks} urgent` : null,
    },
    {
      label: "Documents",
      value: stats.documents,
      icon: FileText,
      href: "/dashboard/docs",
      color: "from-pink-500 to-pink-600",
      badge: null,
    },
    {
      label: "Notifications",
      value: stats.unreadNotifications,
      icon: Bell,
      href: "/dashboard",
      color: "from-purple-500 to-purple-600",
      badge: stats.unreadNotifications > 0 ? "unread" : null,
    },
  ];

  const quickActions = [
    {
      label: "New message",
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "New task",
      icon: Plus,
      href: "/dashboard/tasks",
      color: "from-green-500 to-green-600",
    },
    {
      label: "New document",
      icon: FileText,
      href: "/dashboard/docs",
      color: "from-pink-500 to-pink-600",
    },
    {
      label: "Start call",
      icon: Video,
      href: "/dashboard/chat",
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Invite team",
      icon: Users,
      href: "/dashboard/team",
      color: "from-orange-500 to-orange-600",
    },
    {
      label: "View analytics",
      icon: TrendingUp,
      href: "/dashboard/analytics",
      color: "from-cyan-500 to-cyan-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-muted">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* ===== GREETING ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-muted text-sm md:text-base">{subtitle}</p>
      </motion.div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={stat.href}
              className="group block rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 md:p-5 hover:bg-foreground/5 dark:hover:bg-foreground/10 hover:border-border/80 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-muted border border-border/50">
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ===== TEAM ONLINE ===== */}
      {teamOnline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Team online now
            </h2>
            <span className="text-xs text-muted">{teamOnline.length} active</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {teamOnline.map((member) => (
              <div
                key={member.id}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white overflow-hidden ring-2 ring-green-500/50">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(member.name, member.email)
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
                <span className="text-[10px] text-muted truncate max-w-[60px]">
                  {member.name?.split(" ")[0] || "User"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ===== MAIN GRID ===== */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Recent chats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Recent chats
            </h2>
            <Link
              href="/dashboard/chat"
              className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              desc="Start chatting with your team"
              cta="Start a chat"
              href="/dashboard/chat"
            />
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => {
                const displayName = c.isGroup
                  ? c.displayName || c.name || "Group"
                  : c.otherUser?.name || c.otherUser?.email || "Unknown";
                const initial = c.isGroup
                  ? "#"
                  : c.otherUser?.name?.[0]?.toUpperCase() || "?";
                const online = isOnline(c.otherUser?.lastSeenAt);

                return (
                  <Link
                    key={c.id}
                    href="/dashboard/chat"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white overflow-hidden">
                        {c.otherUser?.image ? (
                          <img
                            src={c.otherUser.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      {online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {c.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {c.lastMessage && (
                        <span className="text-[10px] text-muted">
                          {timeAgo(c.lastMessage.createdAt)}
                        </span>
                      )}
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Active tasks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Priority tasks
            </h2>
            <Link
              href="/dashboard/tasks"
              className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1 group"
            >
              All
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No active tasks"
              desc="You're all caught up"
              cta="Create task"
              href="/dashboard/tasks"
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => {
                const priority = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.LOW;
                const isOverdue =
                  t.dueDate && new Date(t.dueDate).getTime() < Date.now();
                return (
                  <Link
                    key={t.id}
                    href="/dashboard/tasks"
                    className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-foreground/5 transition group"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${priority.dot} flex-shrink-0 mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] ${priority.text} font-medium`}>
                          {priority.label}
                        </span>
                        {t.dueDate && (
                          <span
                            className={`text-[10px] flex items-center gap-0.5 ${
                              isOverdue ? "text-red-500" : "text-muted"
                            }`}
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(t.dueDate).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                            })}
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

      {/* ===== BOTTOM GRID ===== */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Documents */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-500" />
              Recent docs
            </h2>
            <Link
              href="/dashboard/docs"
              className="text-xs text-pink-500 hover:text-pink-400 flex items-center gap-1 group"
            >
              All
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              desc="Write your first doc"
              cta="Create doc"
              href="/dashboard/docs"
            />
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <Link
                  key={doc.id}
                  href="/dashboard/docs"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/5 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-[10px] text-muted">
                      {timeAgo(doc.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              Recent activity
            </h2>
            <span className="text-xs text-muted">Last 24 hours</span>
          </div>

          {activity.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted">
              No activity yet. Start using Nexus!
            </div>
          ) : (
            <div className="space-y-2">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded-xl hover:bg-foreground/5 transition"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === "message"
                        ? "bg-blue-500/10 text-blue-500"
                        : item.type === "task"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-pink-500/10 text-pink-500"
                    }`}
                  >
                    {item.type === "message" ? (
                      <MessageSquare className="w-3.5 h-3.5" />
                    ) : item.type === "task" ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.title}</p>
                    <p className="text-[10px] text-muted">
                      {item.userName} • {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6"
      >
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Quick actions
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-3 md:p-4 hover:bg-foreground/5 dark:hover:bg-foreground/10 hover:border-border/80 transition flex flex-col items-center text-center"
            >
              <div
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-white`}
              >
                <action.icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] md:text-xs font-medium leading-tight">
                {action.label}
              </p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ===== PRO TIP (desktop only) ===== */}
      <div className="hidden md:flex rounded-2xl border border-border bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-5 items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1">
            Pro tip: Use the command palette
          </h3>
          <p className="text-xs text-muted">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/5 text-[10px]">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/5 text-[10px]">
              K
            </kbd>{" "}
            to jump anywhere in Nexus instantly.
          </p>
        </div>
      </div>
    </div>
  );
}

// ===== EMPTY STATE COMPONENT =====
function EmptyState({
  icon: Icon,
  title,
  desc,
  cta,
  href,
}: {
  icon: any;
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="text-center py-6 px-4">
      <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-muted" />
      </div>
      <p className="text-sm font-medium mb-0.5">{title}</p>
      <p className="text-xs text-muted mb-3">{desc}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 transition"
      >
        {cta}
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
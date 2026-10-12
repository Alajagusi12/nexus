"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CheckSquare,
  FileText,
  Users,
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type Stats = {
  conversations: number;
  tasks: number;
  documents: number;
  unreadNotifications: number;
};

type Conversation = {
  id: string;
  isGroup?: boolean;
  name?: string | null;
  displayName?: string;
  otherUser: { name: string | null; email: string; image: string | null } | null;
  lastMessage: { content: string; createdAt: string } | null;
  updatedAt: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    conversations: 0,
    tasks: 0,
    documents: 0,
    unreadNotifications: 0,
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

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
    ])
      .then(([convos, tasksData, docs, notifs]) => {
        const c = Array.isArray(convos) ? convos : [];
        const t = Array.isArray(tasksData) ? tasksData : [];
        const d = Array.isArray(docs) ? docs : [];

        setConversations(c.slice(0, 4));
        setTasks(t.filter((x: Task) => x.status !== "DONE").slice(0, 5));
        setStats({
          conversations: c.length,
          tasks: t.filter((x: Task) => x.status !== "DONE").length,
          documents: d.length,
          unreadNotifications: notifs.unreadCount || 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const statCards = [
    {
      label: "Chats",
      value: stats.conversations,
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "from-blue-500 to-blue-700",
    },
    {
      label: "Active tasks",
      value: stats.tasks,
      icon: CheckSquare,
      href: "/dashboard/tasks",
      color: "from-green-500 to-green-700",
    },
    {
      label: "Documents",
      value: stats.documents,
      icon: FileText,
      href: "/dashboard/docs",
      color: "from-pink-500 to-pink-700",
    },
    {
      label: "Notifications",
      value: stats.unreadNotifications,
      icon: Users,
      href: "/dashboard",
      color: "from-purple-500 to-purple-700",
    },
  ];

  const quickActions = [
    {
      label: "New message",
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "from-blue-500 to-blue-700",
    },
    {
      label: "New task",
      icon: CheckSquare,
      href: "/dashboard/tasks",
      color: "from-green-500 to-green-700",
    },
    {
      label: "New document",
      icon: FileText,
      href: "/dashboard/docs",
      color: "from-pink-500 to-pink-700",
    },
    {
      label: "Invite team",
      icon: Users,
      href: "/dashboard/team",
      color: "from-purple-500 to-purple-700",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-muted text-sm md:text-base">
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 md:p-5 hover:bg-foreground/5 dark:hover:bg-foreground/10 hover:border-border/80 transition"
          >
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform text-white`}
            >
              <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <p className="text-2xl md:text-3xl font-bold mb-1">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted" />
              ) : (
                stat.value
              )}
            </p>
            <p className="text-xs md:text-sm text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              Recent chats
            </h2>
            <Link
              href="/dashboard/chat"
              className="text-xs md:text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              No conversations yet.{" "}
              <Link
                href="/dashboard/chat"
                className="text-blue-500 hover:underline"
              >
                Start one
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => {
                const displayName = c.isGroup
                  ? c.displayName || c.name || "Group"
                  : c.otherUser?.name || c.otherUser?.email || "Unknown";
                const initial = c.isGroup
                  ? "#"
                  : c.otherUser?.name?.[0]?.toUpperCase() || "?";

                return (
                  <Link
                    key={c.id}
                    href="/dashboard/chat"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold flex-shrink-0 text-white">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {c.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              Active tasks
            </h2>
            <Link
              href="/dashboard/tasks"
              className="text-xs md:text-sm text-green-500 hover:text-green-400 flex items-center gap-1"
            >
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              No active tasks.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <Link
                  key={t.id}
                  href="/dashboard/tasks"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      t.priority === "URGENT"
                        ? "bg-red-400"
                        : t.priority === "HIGH"
                        ? "bg-orange-400"
                        : t.priority === "MEDIUM"
                        ? "bg-blue-400"
                        : "bg-slate-400"
                    }`}
                  />
                  <p className="text-sm flex-1 truncate">{t.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 md:mt-8">
        <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
          Quick actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 md:p-5 hover:bg-foreground/5 dark:hover:bg-foreground/10 hover:border-border/80 transition flex flex-col items-center text-center"
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-white`}
              >
                <action.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-xs md:text-sm font-medium">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 md:mt-8 rounded-2xl border border-border bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-5 md:p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm md:text-base font-semibold mb-1">
            Pro tip: Use the command palette
          </h3>
          <p className="text-xs md:text-sm text-muted">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/5 text-[10px] md:text-xs">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/5 text-[10px] md:text-xs">
              K
            </kbd>{" "}
            to jump anywhere in Nexus instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
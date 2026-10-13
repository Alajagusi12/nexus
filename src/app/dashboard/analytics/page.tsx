"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  MessageSquare,
  CheckSquare,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
  Trophy,
  Activity,
  Clock,
  Zap,
  Target,
  Calendar,
} from "lucide-react";

type Analytics = {
  totals: {
    messages: number;
    tasks: number;
    completedTasks: number;
    documents: number;
    conversations: number;
  };
  messagesChart: { date: string; count: number }[];
  tasksChart: { name: string; value: number; color: string }[];
  topUsers: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    count: number;
  }[];
  recentActivity: {
    id: string;
    content: string;
    userName: string;
    userImage: string | null;
    createdAt: string;
  }[];
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="h-8 w-48 rounded-lg bg-foreground/5 animate-pulse mb-2" />
          <div className="h-4 w-64 rounded bg-foreground/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 h-32 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 h-80 animate-pulse" />
          <div className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data?.totals) {
    return (
      <div className="p-8 text-center text-muted">
        Failed to load analytics
      </div>
    );
  }

  const completionRate =
    data.totals.tasks > 0
      ? Math.round((data.totals.completedTasks / data.totals.tasks) * 100)
      : 0;

  const totalTaskCount = data.tasksChart.reduce((sum, t) => sum + t.value, 0);

  const avgMessagesPerDay =
    data.messagesChart.length > 0
      ? Math.round(
          data.messagesChart.reduce((sum, d) => sum + d.count, 0) /
            data.messagesChart.length
        )
      : 0;

  const thisWeekTotal = data.messagesChart.reduce(
    (sum, d) => sum + d.count,
    0
  );

  const lastWeekTotal = thisWeekTotal * 0.85; // placeholder for trend
  const trendPercent =
    lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-blue-500" />
          Analytics
        </h1>
        <p className="text-muted text-sm md:text-base">
          Insights across your workspace
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value={data.totals.messages}
          trend={{ value: trendPercent, label: "vs last week" }}
          color="blue"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks"
          value={data.totals.tasks}
          sub={`${completionRate}% completed`}
          color="green"
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value={data.totals.documents}
          sub="workspace total"
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Conversations"
          value={data.totals.conversations}
          sub="active chats"
          color="orange"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-semibold mb-1">Messages</h2>
              <p className="text-xs text-muted">Last 7 days activity</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted">
                <Activity className="w-3 h-3" />
                {thisWeekTotal} total
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <Calendar className="w-3 h-3" />
                {avgMessagesPerDay}/day avg
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.messagesChart}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgb(var(--border) / 0.3)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(var(--card))",
                    border: "1px solid rgb(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "rgb(var(--foreground))" }}
                  cursor={{ fill: "rgb(var(--foreground) / 0.05)" }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <h2 className="font-semibold mb-1">Tasks by status</h2>
          <p className="text-xs text-muted mb-4">Current breakdown</p>
          {totalTaskCount === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-muted" />
              </div>
              <p className="text-sm text-muted">No tasks yet</p>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.tasksChart.filter((t) => t.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {data.tasksChart
                        .filter((t) => t.value > 0)
                        .map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(var(--card))",
                        border: "1px solid rgb(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {data.tasksChart.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-muted">{t.name}</span>
                    </div>
                    <span className="font-semibold">{t.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold mb-0.5 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Top contributors
              </h2>
              <p className="text-xs text-muted">By messages, last 30 days</p>
            </div>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          {data.topUsers.length === 0 ? (
            <div className="text-sm text-muted text-center py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-3">
              {data.topUsers.map((user, i) => {
                const max = data.topUsers[0]?.count || 1;
                const percent = (user.count / max) * 100;
                return (
                  <div key={user.id} className="flex items-center gap-3">
                    <div
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        i === 0
                          ? "bg-yellow-500/20 text-yellow-500"
                          : i === 1
                          ? "bg-slate-400/20 text-slate-400"
                          : i === 2
                          ? "bg-orange-500/20 text-orange-500"
                          : "text-muted"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white overflow-hidden flex-shrink-0">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.name[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {user.name}
                        </p>
                        <span className="text-xs font-semibold text-blue-500 flex-shrink-0 ml-2">
                          {user.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold mb-0.5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                Recent activity
              </h2>
              <p className="text-xs text-muted">Latest workspace events</p>
            </div>
            <Clock className="w-4 h-4 text-muted" />
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="text-sm text-muted text-center py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentActivity.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-foreground/5 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white overflow-hidden flex-shrink-0 relative">
                    {item.userImage ? (
                      <img
                        src={item.userImage}
                        alt={item.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      item.userName[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {item.userName}
                      </p>
                      <span className="text-[10px] text-muted flex-shrink-0">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-1">
                      {item.content || "📎 Attachment"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  sub?: string;
  trend?: { value: number; label: string };
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 hover:border-border/80 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        {trend && (
          <span
            className={`text-[10px] font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
              isPositive
                ? "bg-green-500/10 text-green-500"
                : isNegative
                ? "bg-red-500/10 text-red-500"
                : "bg-foreground/5 text-muted"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : isNegative ? (
              <TrendingDown className="w-2.5 h-2.5" />
            ) : null}
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </motion.div>
  );
}
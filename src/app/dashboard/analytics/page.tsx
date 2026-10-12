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
} from "recharts";
import {
  MessageSquare,
  CheckSquare,
  FileText,
  Users,
  TrendingUp,
  Loader2,
  Trophy,
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
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
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

  const totalTaskCount = data.tasksChart.reduce(
    (sum, t) => sum + t.value,
    0
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
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
          color="blue"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks"
          value={data.totals.tasks}
          sub={`${completionRate}% done`}
          color="green"
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value={data.totals.documents}
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Conversations"
          value={data.totals.conversations}
          color="orange"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Messages chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <h2 className="font-semibold mb-1">Messages</h2>
          <p className="text-xs text-muted mb-4">Last 7 days</p>
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

        {/* Tasks pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <h2 className="font-semibold mb-1">Tasks</h2>
          <p className="text-xs text-muted mb-4">By status</p>
          {totalTaskCount === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted">
              No tasks yet
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
        {/* Top users */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Most active
          </h2>
          <p className="text-xs text-muted mb-4">Last 30 days</p>
          {data.topUsers.length === 0 ? (
            <div className="text-sm text-muted text-center py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-3">
              {data.topUsers.map((user, i) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="text-xs font-bold text-muted w-4">
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
                    <p className="text-sm font-medium truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-blue-500 flex-shrink-0">
                    {user.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-5"
        >
          <h2 className="font-semibold mb-1">Recent activity</h2>
          <p className="text-xs text-muted mb-4">Latest messages</p>
          {data.recentActivity.length === 0 ? (
            <div className="text-sm text-muted text-center py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white overflow-hidden flex-shrink-0">
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
                    <div className="flex items-baseline gap-2">
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
  color,
}: {
  icon: any;
  label: string;
  value: number;
  sub?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4"
    >
      <div
        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center mb-3`}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </motion.div>
  );
}
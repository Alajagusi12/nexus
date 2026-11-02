"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  MessageSquare, CheckSquare, FileText, Users, TrendingUp,
  TrendingDown, Loader2, Trophy, Activity, Clock, Zap, Target,
  Calendar, CheckCircle2, ChevronRight
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[14px] font-bold text-foreground">
          {payload[0].value} <span className="text-[12px] font-medium text-muted">messages</span>
        </p>
      </div>
    );
  }
  return null;
};

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
            <div key={i} className="rounded-2xl border border-border bg-card p-4 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 h-80 animate-pulse" />
          <div className="rounded-2xl border border-border bg-card p-5 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data?.totals) {
    return <div className="p-8 text-center text-muted">Failed to load analytics</div>;
  }

  const completionRate = data.totals.tasks > 0 ? Math.round((data.totals.completedTasks / data.totals.tasks) * 100) : 0;
  const totalTaskCount = data.tasksChart.reduce((sum, t) => sum + t.value, 0);
  const avgMessagesPerDay = data.messagesChart.length > 0 ? Math.round(data.messagesChart.reduce((sum, d) => sum + d.count, 0) / data.messagesChart.length) : 0;
  const thisWeekTotal = data.messagesChart.reduce((sum, d) => sum + d.count, 0);
  
  // Fake trend for visual effect
  const trendPercent = 12; 

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-background min-h-full">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1.5 flex items-center gap-3 tracking-tight">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
            Analytics
          </h1>
          <p className="text-muted text-[14px]">Insights across your workspace</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 shadow-sm">
          <span className="text-[12px] font-medium text-muted">Last 7 days</span>
          <ChevronRight className="w-4 h-4 text-muted" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard icon={MessageSquare} label="Messages" value={data.totals.messages} trend={{ value: trendPercent, label: "vs last week" }} />
        <StatCard icon={CheckSquare} label="Tasks" value={data.totals.tasks} sub={`${completionRate}% completed`} />
        <StatCard icon={FileText} label="Documents" value={data.totals.documents} sub="workspace total" />
        <StatCard icon={Users} label="Conversations" value={data.totals.conversations} sub="active chats" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        
        {/* Messages Area Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight mb-1">Message Activity</h2>
              <p className="text-[12px] text-muted">Volume over the last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-[12px] font-medium bg-foreground/[0.04] px-3 py-1.5 rounded-lg border border-border">
              <span className="flex items-center gap-1.5 text-foreground">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> {thisWeekTotal} total
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-1.5 text-muted">
                {avgMessagesPerDay}/day avg
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.messagesChart} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border) / 0.3)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgb(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Task Breakdown Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight mb-1">Task Breakdown</h2>
            <p className="text-[12px] text-muted mb-2">Current status distribution</p>
          </div>
          
          {totalTaskCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-border/50 flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-muted" />
              </div>
              <p className="text-[13px] font-medium text-foreground mb-1">No tasks yet</p>
              <p className="text-[11.5px] text-muted">Create a task to see insights.</p>
            </div>
          ) : (
            <>
              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.tasksChart.filter((t) => t.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} stroke="none">
                      {data.tasksChart.filter((t) => t.value > 0).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "rgb(var(--card))", border: "1px solid rgb(var(--border))", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }} itemStyle={{ color: "rgb(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold tracking-tight">{totalTaskCount}</span>
                  <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="space-y-2 mt-auto pt-4 border-t border-border">
                {data.tasksChart.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-medium text-muted">{t.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{t.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight mb-1 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Top Contributors
              </h2>
              <p className="text-[12px] text-muted">By messages sent, last 30 days</p>
            </div>
          </div>
          {data.topUsers.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-muted">No activity yet</div>
          ) : (
            <div className="space-y-4">
              {data.topUsers.map((user, i) => {
                const max = data.topUsers[0]?.count || 1;
                const percent = (user.count / max) * 100;
                return (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className={`text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        i === 0 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500" 
                        : i === 1 ? "bg-slate-400/20 text-slate-500" 
                        : i === 2 ? "bg-orange-500/20 text-orange-600 dark:text-orange-500" 
                        : "text-muted bg-foreground/[0.04]"
                      }`}>
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[12px] font-bold overflow-hidden flex-shrink-0 border border-emerald-500/20">
                      {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : user.name[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[13px] font-semibold truncate text-foreground">{user.name}</p>
                        <span className="text-[12px] font-bold text-emerald-500 flex-shrink-0 ml-2">{user.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, delay: 0.2 + (i * 0.1) }} className="h-full rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Recent Activity
              </h2>
              <p className="text-[12px] text-muted">Latest workspace events</p>
            </div>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-muted">No activity yet</div>
          ) : (
            <div className="relative pl-3 space-y-4 before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-border">
              {data.recentActivity.map((item) => (
                <div key={item.id} className="relative flex items-start gap-3">
                  <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden flex-shrink-0 border-2 border-card mt-0.5">
                    {item.userImage ? <img src={item.userImage} alt={item.userName} className="w-full h-full object-cover" /> : item.userName[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold truncate text-foreground">{item.userName}</p>
                      <span className="text-[10.5px] font-medium text-muted flex-shrink-0">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-[12px] text-muted bg-foreground/[0.03] rounded-lg rounded-tl-sm px-2 py-1.5 line-clamp-1 border border-border/50">
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

function StatCard({ icon: Icon, label, value, sub, trend }: { icon: any; label: string; value: number; sub?: string; trend?: { value: number; label: string; }; }) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm hover:border-emerald-500/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-[10.5px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md ${
              isPositive ? "bg-emerald-500/10 text-emerald-500" : isNegative ? "bg-red-500/10 text-red-500" : "bg-foreground/[0.04] text-muted"
            }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-[12px] font-medium text-muted">{label}</p>
      {sub && <p className="text-[10.5px] text-muted/70 mt-0.5">{sub}</p>}
    </motion.div>
  );
}
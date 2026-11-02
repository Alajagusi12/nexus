"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ArrowLeft, Search, Loader2, ShieldAlert, CheckCircle2,
  FileText, CheckSquare, MessageSquare, UserPlus, Settings, Clock,
  LogIn, Trash2, Pencil, X
} from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });
}

// Maps an action string to an icon and color
function getActionStyle(action: string, targetType: string | null) {
  const act = action.toUpperCase();
  const target = (targetType || "").toUpperCase();

  if (act.includes("CREATE")) {
    if (target.includes("TASK")) return { icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (target.includes("DOC")) return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    if (target.includes("MESSAGE")) return { icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" };
    return { icon: UserPlus, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" };
  }
  
  if (act.includes("DELETE") || act.includes("REMOVE")) {
    return { icon: Trash2, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
  }
  
  if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("RENAME")) {
    return { icon: Pencil, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
  }

  if (act.includes("LOGIN") || act.includes("JOIN")) {
    return { icon: LogIn, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  }

  if (act.includes("ROLE") || act.includes("TRANSFER") || act.includes("SETTINGS")) {
    return { icon: ShieldAlert, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
  }

  return { icon: Activity, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" };
}

export default function WorkspaceActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/workspaces/activity", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(log => 
      log.action.toLowerCase().includes(q) ||
      log.targetType?.toLowerCase().includes(q) ||
      log.user.name?.toLowerCase().includes(q) ||
      log.user.email.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  // Group logs by Date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    filteredLogs.forEach(log => {
      const day = getDayLabel(log.createdAt);
      if (!groups[day]) groups[day] = [];
      groups[day].push(log);
    });
    return groups;
  }, [filteredLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-background min-h-full">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/settings/workspace" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-foreground transition mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to settings
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mb-1.5 flex items-center gap-3 tracking-tight">
            <Activity className="w-7 h-7 text-emerald-500" />
            Workspace Activity
          </h1>
          <p className="text-muted text-[14px]">
            A complete history of everything happening in your workspace.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by action, user, or target..."
          className="w-full rounded-2xl border border-border bg-foreground/[0.02] pl-10 pr-10 py-3 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-foreground/[0.08] transition">
            <X className="w-4 h-4 text-muted" />
          </button>
        )}
      </div>

      {/* Activity Feed */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-border border-dashed rounded-2xl bg-foreground/[0.01]">
          <div className="w-16 h-16 rounded-2xl bg-foreground/[0.04] flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-muted" />
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">
            {searchQuery ? "No matching activity" : "No activity yet"}
          </p>
          <p className="text-[13px] text-muted">
            {searchQuery ? "Try a different search term." : "Actions will appear here as your team works."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([day, dayLogs]) => (
            <div key={day}>
              {/* Date Divider */}
              <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/90 backdrop-blur-sm z-10 py-2">
                <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wider">{day}</h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Logs for this day */}
              <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[27px] before:w-px before:bg-border">
                {dayLogs.map((log) => {
                  const style = getActionStyle(log.action, log.targetType);
                  const Icon = style.icon;
                  
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={log.id} className="relative flex items-start gap-4 group">
                      {/* Icon */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-background ${style.bg} ${style.color} shadow-sm mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-3.5 shadow-sm hover:border-emerald-500/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13.5px] font-semibold text-foreground">
                              {log.user.name || log.user.email}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${style.bg} ${style.color} border ${style.border}`}>
                              {log.action}
                            </span>
                            {log.targetType && (
                              <span className="text-[11px] font-medium text-muted bg-foreground/[0.04] px-1.5 py-0.5 rounded-md">
                                {log.targetType}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-muted flex-shrink-0" title={new Date(log.createdAt).toLocaleString()}>
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                        {log.metadata && (
                          <p className="text-[12.5px] text-muted mt-1.5 leading-relaxed">
                            {log.metadata}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* End of feed */}
          <div className="text-center pt-6 pb-12">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted bg-foreground/[0.03] px-3 py-1.5 rounded-full border border-border">
              <Clock className="w-3.5 h-3.5" /> Beginning of activity history
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
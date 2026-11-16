"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare,
  Plus, Loader2, ArrowRight, Clock, AlertCircle
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-slate-500",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    fetch("/api/tasks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const days = useMemo(() => {
    const arr = [];
    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      arr.push(null);
    }
    // Actual days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(new Date(year, currentDate.getMonth(), i));
    }
    return arr;
  }, [firstDay, daysInMonth, year, currentDate]);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const dateStr = new Date(task.dueDate).toISOString().split("T")[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(task);
    });
    return map;
  }, [tasks]);

  const selectedDateTasks = selectedDate 
    ? tasksByDate[selectedDate.toISOString().split("T")[0]] || [] 
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-background">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-emerald-500" />
            Calendar
          </h1>
          <p className="text-[13.5px] text-muted">View your tasks, deadlines, and upcoming events.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-2 rounded-xl border border-border bg-card text-[13px] font-semibold hover:bg-foreground/[0.04] transition shadow-sm">
            Today
          </button>
          <div className="flex items-center bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <button onClick={prevMonth} className="p-2 hover:bg-foreground/[0.04] transition border-r border-border"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-4 py-2 text-[13px] font-bold min-w-[120px] text-center">{monthName} {year}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-foreground/[0.04] transition border-l border-border"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Calendar Grid */}
        <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-border bg-foreground/[0.02]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2.5 text-center text-[11px] font-bold text-muted uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {days.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-border/50 bg-foreground/[0.01]" />;
              
              const dateStr = date.toISOString().split("T")[0];
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = new Date().toISOString().split("T")[0] === dateStr;
              const isSelected = selectedDate?.toISOString().split("T")[0] === dateStr;
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(date)}
                  className={`relative min-h-[80px] p-2 border-b border-r border-border/50 text-left transition-colors flex flex-col ${
                    isSelected ? "bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/30" : "hover:bg-foreground/[0.02]"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold mb-1 ${
                    isToday ? "bg-emerald-500 text-white shadow-sm" : "text-foreground"
                  }`}>
                    {date.getDate()}
                  </span>
                  
                  <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="flex items-center gap-1.5 truncate">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_COLORS[t.priority] || "bg-slate-500"}`} />
                        <span className="text-[10.5px] font-medium text-foreground/80 truncate">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[9.5px] font-bold text-muted pl-3">+{dayTasks.length - 2} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel (Selected Date Tasks) */}
        <div className="w-full lg:w-80 flex-shrink-0 rounded-2xl border border-border bg-card shadow-sm flex flex-col h-[300px] lg:h-auto">
          <div className="p-5 border-b border-border flex items-center justify-between bg-foreground/[0.01]">
            <div>
              <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Selected Date</p>
              <h2 className="text-[16px] font-bold text-foreground">
                {selectedDate ? selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" }) : "Pick a date"}
              </h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
            {selectedDateTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-xl bg-foreground/[0.03] flex items-center justify-center mb-3">
                  <CheckSquare className="w-5 h-5 text-muted" />
                </div>
                <p className="text-[13px] font-semibold text-foreground mb-1">No tasks due</p>
                <p className="text-[12px] text-muted">You have a clear schedule for this day.</p>
              </div>
            ) : (
              selectedDateTasks.map(task => (
                <Link key={task.id} href="/dashboard/tasks" className="block p-3 rounded-xl border border-border/50 hover:bg-foreground/[0.03] hover:border-emerald-500/30 transition group">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_COLORS[task.priority] || "bg-slate-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground leading-snug group-hover:text-emerald-500 transition">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground/[0.04] text-muted">{task.priority}</span>
                        {task.status === "DONE" && <span className="text-[10px] font-bold text-emerald-500">Completed</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-border bg-foreground/[0.01]">
            <Link href="/dashboard/tasks" className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition shadow-sm">
              <Plus className="w-4 h-4" /> Add Task
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
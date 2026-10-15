"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  X,
  CheckSquare,
  Plus,
  ExternalLink,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-slate-500/20 text-slate-500 border-slate-500/30 dark:text-slate-400",
  MEDIUM: "bg-blue-500/20 text-blue-500 border-blue-500/30 dark:text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-500 border-orange-500/30 dark:text-orange-400",
  URGENT: "bg-red-500/20 text-red-500 border-red-500/30 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b);
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/tasks", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = toDateKey(new Date(t.dueDate));
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    // Sort each day by priority
    const order: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    Object.keys(map).forEach((key) => {
      map[key].sort(
        (a, b) => (order[a.priority] || 99) - (order[b.priority] || 99)
      );
    });
    return map;
  }, [tasks]);

  const grid = useMemo(
    () => getMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const today = startOfDay(new Date());

  const monthTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return (
        d.getMonth() === viewDate.getMonth() &&
        d.getFullYear() === viewDate.getFullYear()
      );
    });
  }, [tasks, viewDate]);

  const selectedDayTasks = selectedDay
    ? tasksByDay[toDateKey(selectedDay)] || []
    : [];

  function prevMonth() {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  }

  function nextMonth() {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  }

  function goToToday() {
    setViewDate(new Date());
    setSelectedDay(startOfDay(new Date()));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-blue-500" />
            Calendar
          </h1>
          <p className="text-muted text-sm">
            {monthTasks.length} {monthTasks.length === 1 ? "task" : "tasks"} this
            month
          </p>
        </div>

        <Link
          href="/dashboard/tasks"
          className="rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 transition px-4 py-2.5 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New task
        </Link>
      </div>

      {/* Month controls */}
      <div className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 overflow-hidden">
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-foreground/10 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-foreground/10 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <h2 className="text-base md:text-lg font-semibold ml-1">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
          </div>

          <button
            onClick={goToToday}
            className="rounded-lg border border-border hover:bg-foreground/5 transition px-3 py-1.5 text-xs font-medium"
          >
            Today
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="p-2 md:p-3 text-center text-[10px] md:text-xs font-semibold text-muted uppercase tracking-wider"
            >
              <span className="md:hidden">{d[0]}</span>
              <span className="hidden md:inline">{d}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            const key = toDateKey(day);
            const dayTasks = tasksByDay[key] || [];
            const isCurrentMonth =
              day.getMonth() === viewDate.getMonth();
            const isToday = sameDay(day, today);
            const isSelected = selectedDay && sameDay(day, selectedDay);

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`relative min-h-[80px] md:min-h-[110px] p-1.5 md:p-2 border-r border-b border-border transition text-left ${
                  isSelected
                    ? "bg-blue-500/10"
                    : "hover:bg-foreground/5"
                } ${(i + 1) % 7 === 0 ? "border-r-0" : ""} ${
                  i >= 35 ? "border-b-0" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center ${
                      isToday
                        ? "bg-blue-500 text-white"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted/50"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[9px] md:text-[10px] text-muted font-medium">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Task chips */}
                <div className="space-y-0.5 md:space-y-1">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className={`hidden md:flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] truncate ${
                        t.status === "DONE"
                          ? "opacity-50 line-through"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          PRIORITY_DOT[t.priority]
                        }`}
                      />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id + "-mobile"}
                      className="md:hidden flex items-center gap-1"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          PRIORITY_DOT[t.priority]
                        }`}
                      />
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="hidden md:block text-[9px] text-muted pl-3">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      <AnimatePresence>
        {selectedDay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed md:relative bottom-0 md:bottom-auto left-0 right-0 md:left-auto md:right-auto z-50 md:z-0 mt-4 rounded-t-3xl md:rounded-2xl border border-border bg-card md:bg-foreground/[0.02] shadow-2xl md:shadow-none p-5"
            >
              <div className="md:hidden flex justify-center pb-2 mb-3">
                <div className="w-10 h-1 rounded-full bg-muted/40" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">
                    {selectedDay.toLocaleDateString("en", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {selectedDayTasks.length}{" "}
                    {selectedDayTasks.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-10 h-10 text-muted opacity-40 mx-auto mb-3" />
                  <p className="text-sm text-muted">
                    No tasks due this day
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map((t) => (
                    <Link
                      key={t.id}
                      href="/dashboard/tasks"
                      className="block rounded-xl border border-border bg-background md:bg-foreground/[0.02] hover:bg-foreground/5 transition p-3 group"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            PRIORITY_DOT[t.priority]
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium mb-1 ${
                              t.status === "DONE"
                                ? "line-through opacity-50"
                                : ""
                            }`}
                          >
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-xs text-muted line-clamp-2 mb-2">
                              {t.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                PRIORITY_BADGE[t.priority]
                              }`}
                            >
                              {t.priority}
                            </span>
                            <span className="text-[10px] text-muted">
                              {STATUS_LABEL[t.status]}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
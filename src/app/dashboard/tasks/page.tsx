"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Plus, X, Trash2, Loader2, Calendar } from "lucide-react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  order: number;
  creatorId: string;
  assigneeId: string | null;
  creator: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
};

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "TODO", label: "To Do", color: "bg-slate-500" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { id: "REVIEW", label: "Review", color: "bg-yellow-500" },
  { id: "DONE", label: "Done", color: "bg-green-500" },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-slate-500/20 text-slate-500 border-slate-500/30 dark:text-slate-400",
  MEDIUM:
    "bg-blue-500/20 text-blue-500 border-blue-500/30 dark:text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-500 border-orange-500/30 dark:text-orange-400",
  URGENT: "bg-red-500/20 text-red-500 border-red-500/30 dark:text-red-400",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Priority,
    dueDate: "",
  });
  const [creating, setCreating] = useState(false);

  async function loadTasks() {
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Task" },
        () => loadTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setNewTask({
          title: "",
          description: "",
          priority: "MEDIUM",
          dueDate: "",
        });
        setShowNewTask(false);
        loadTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error(err);
      loadTasks();
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      loadTasks();
    }
  }

  function handleDragStart(taskId: string) {
    setDraggedTask(taskId);
  }

  function handleDragOver(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    setDragOverColumn(status);
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    if (draggedTask) {
      updateTaskStatus(draggedTask, status);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  }

  function tasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status);
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} total
          </p>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.id);
            const isOver = dragOverColumn === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl border flex flex-col transition ${
                  isOver
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-border bg-foreground/[0.02] dark:bg-foreground/5"
                }`}
              >
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                    <span className="text-xs text-muted">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <AnimatePresence>
                    {colTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className={`group rounded-xl border border-border bg-card p-3 cursor-move hover:border-border/80 shadow-sm transition ${
                          draggedTask === task.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium flex-1">
                            {task.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                              PRIORITY_COLORS[task.priority]
                            }`}
                          >
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString(
                                "en",
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted/60">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewTask && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={() => setShowNewTask(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">New Task</h3>
              <button
                onClick={() => setShowNewTask(false)}
                className="p-1 rounded-lg hover:bg-foreground/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={createTask} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">
                  Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                  autoFocus
                  className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="What needs to be done?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                  placeholder="Optional details"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as Priority,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 font-medium hover:bg-foreground/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTask.title.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Task"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Plus, X, Trash2, Loader2, Calendar, Search, 
  User, AlignLeft, CheckCircle2, Circle, Clock, AlertCircle,
  MessageSquare, Send, CheckSquare, Square, Tag, Users, Filter
} from "lucide-react";

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
  subtasks?: { id: string; title: string; completed: boolean }[];
  comments?: { id: string; content: string; createdAt: string; user: { name: string | null, image: string | null } }[];
  labels?: string[];
};

type TeamMember = { id: string; name: string | null; email: string; image: string | null };

const COLUMNS: { id: TaskStatus; label: string; color: string; icon: any }[] = [
  { id: "TODO", label: "To Do", color: "text-slate-500", icon: Circle },
  { id: "IN_PROGRESS", label: "In Progress", color: "text-emerald-500", icon: Clock },
  { id: "REVIEW", label: "Review", color: "text-yellow-500", icon: AlertCircle },
  { id: "DONE", label: "Done", color: "text-blue-500", icon: CheckCircle2 },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  MEDIUM: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Overlays
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("TODO");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Drag state
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">("ALL");

  // New Task Form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Priority,
    dueDate: "",
  });
  const [creating, setCreating] = useState(false);

  // Task Details Forms
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [isAddingLabel, setIsAddingLabel] = useState(false);

  const commentInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    try {
      const [tasksRes, teamRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/users/team", { cache: "no-store" }) 
      ]);
      
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeam(Array.isArray(teamData) ? teamData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Task" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Keyboard Shortcuts (N for New Task, Esc to close)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowNewTask(false);
        setSelectedTask(null);
      }
      if (e.key.toLowerCase() === "n" && !showNewTask && !selectedTask) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setNewTaskStatus("TODO");
          setShowNewTask(true);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showNewTask, selectedTask]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, status: newTaskStatus }),
      });
      if (res.ok) {
        setNewTask({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
        setShowNewTask(false);
        loadData();
        toast.success("Task created");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function updateTask(taskId: string, updates: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, ...updates });

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error(err);
      loadData();
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      toast.success("Task deleted");
    } catch (err) {
      console.error(err);
      loadData();
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
      updateTask(draggedTask, { status });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = !searchQuery.trim() || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  function tasksByStatus(status: TaskStatus) {
    return filteredTasks.filter((t) => t.status === status);
  }

  function getDueDateColor(dateString: string | null) {
    if (!dateString) return "text-muted";
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (date.getTime() < today.getTime()) return "text-red-500 font-semibold"; 
    if (date.getTime() === today.getTime()) return "text-orange-500 font-semibold"; 
    return "text-muted"; 
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 flex-shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} total
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-foreground/[0.02] pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <select
              value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="rounded-xl border border-border bg-foreground/[0.02] pl-9 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition appearance-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <button
            onClick={() => { setNewTaskStatus("TODO"); setShowNewTask(true); }}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-white font-semibold hover:bg-emerald-600 transition flex items-center gap-2 flex-shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex overflow-x-auto pb-4 gap-4 snap-x">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.id);
            const isOver = dragOverColumn === col.id;
            const Icon = col.icon;
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`min-w-[280px] w-full md:w-1/2 lg:w-1/4 snap-center rounded-2xl border flex flex-col transition-all ${
                  isOver ? "border-emerald-500/50 bg-emerald-500/5 shadow-inner" : "border-border bg-foreground/[0.01]"
                }`}
              >
                <div className="p-3 border-b border-border flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-sm z-10 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${col.color}`} />
                    <h3 className="text-[13px] font-semibold tracking-tight">{col.label}</h3>
                    <span className="text-[11px] font-medium bg-foreground/[0.06] px-2 py-0.5 rounded-full text-muted">
                      {colTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setNewTaskStatus(col.id); setShowNewTask(true); }}
                    className="p-1 rounded-md hover:bg-foreground/[0.06] text-muted transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <AnimatePresence>
                    {colTasks.map((task) => {
                      const totalSubtasks = task.subtasks?.length || 0;
                      const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                      const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;

                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          onClick={() => setSelectedTask(task)}
                          className={`group rounded-xl border border-border bg-card p-3 cursor-pointer hover:border-emerald-500/30 shadow-sm hover:shadow-md transition ${
                            draggedTask === task.id ? "opacity-40" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13.5px] font-medium leading-snug flex-1">
                              {task.title}
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-muted hover:text-red-500 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-[12px] text-muted mt-1.5 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.labels.map(l => (
                                <span key={l} className="text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}

                          {totalSubtasks > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                                <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> {completedSubtasks}/{totalSubtasks}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold tracking-wide ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className={`text-[10.5px] flex items-center gap-1 ${getDueDateColor(task.dueDate)}`}>
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5" title={task.assignee?.name || "Unassigned"}>
                              {task.comments && task.comments.length > 0 && (
                                <span className="text-[10px] text-muted flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {task.comments.length}</span>
                              )}
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30 flex-shrink-0">
                                {task.assignee?.name?.[0]?.toUpperCase() || task.creator?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== NEW TASK MODAL ===================== */}
      {showNewTask && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setShowNewTask(false)}>
          <motion.div
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-[15px]">New Task in {COLUMNS.find(c=>c.id===newTaskStatus)?.label}</h3>
              <button onClick={() => setShowNewTask(false)} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={createTask} className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-foreground/80">Title</label>
                <input
                  type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required autoFocus
                  className="w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  placeholder="What needs to be done?"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-foreground/80">Description</label>
                <textarea
                  value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition resize-none"
                  placeholder="Optional details"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-foreground/80">Priority</label>
                  <select
                    value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                    className="w-full rounded-xl border border-border bg-foreground/[0.04] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-foreground/80">Due date</label>
                  <input
                    type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-border bg-foreground/[0.04] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowNewTask(false)} className="flex-1 rounded-xl border border-border py-2.5 text-[13px] font-medium hover:bg-foreground/[0.04] transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newTask.title.trim()} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-white text-[13px] font-semibold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ===================== ADVANCED TASK DETAILS MODAL ===================== */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 md:p-8" onClick={() => setSelectedTask(null)}>
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-4xl h-full md:h-[85vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 flex flex-col min-w-0 border-r border-border overflow-y-auto">
                <div className="p-5 border-b border-border flex flex-col gap-3 sticky top-0 bg-card z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold tracking-wide ${PRIORITY_COLORS[selectedTask.priority]}`}>
                        {selectedTask.priority}
                      </span>
                      <select
                        value={selectedTask.status}
                        onChange={(e) => updateTask(selectedTask.id, { status: e.target.value as TaskStatus })}
                        className="text-[11px] font-medium text-muted bg-foreground/[0.06] px-2 py-0.5 rounded-md border-none focus:outline-none cursor-pointer hover:bg-foreground/[0.1] transition"
                      >
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] transition flex-shrink-0 md:hidden">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Inline Title Edit */}
                  <input 
                    type="text"
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                    onBlur={() => updateTask(selectedTask.id, { title: selectedTask.title })}
                    className="text-xl font-bold leading-tight bg-transparent border border-transparent hover:border-border focus:border-emerald-500 focus:bg-foreground/[0.02] rounded-lg px-2 -ml-2 py-1 outline-none transition-all w-full"
                  />
                </div>

                <div className="p-5 space-y-8">
                  {/* Description */}
                  <div>
                    <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlignLeft className="w-3.5 h-3.5" /> Description
                    </h4>
                    <textarea
                      value={selectedTask.description || ""}
                      onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                      onBlur={() => updateTask(selectedTask.id, { description: selectedTask.description })}
                      placeholder="Add a more detailed description..."
                      className="w-full bg-transparent border border-transparent hover:border-border focus:border-emerald-500 focus:bg-foreground/[0.02] rounded-lg p-2 -ml-2 text-[14px] text-foreground/80 leading-relaxed resize-none h-24 outline-none transition-all"
                    />
                  </div>

                  {/* Labels */}
                  <div>
                    <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Labels
                    </h4>
                    <div className="flex flex-wrap gap-2 items-center">
                      {selectedTask.labels?.map(label => (
                        <span key={label} className="group flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {label}
                          <button onClick={() => {
                            const updated = selectedTask.labels!.filter(l => l !== label);
                            updateTask(selectedTask.id, { labels: updated });
                          }} className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      
                      {isAddingLabel ? (
                        <input
                          type="text" autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newLabel.trim()) {
                              const updated = [...(selectedTask.labels || []), newLabel.trim()];
                              updateTask(selectedTask.id, { labels: updated });
                              setNewLabel(""); setIsAddingLabel(false);
                            }
                            if (e.key === "Escape") setIsAddingLabel(false);
                          }}
                          onBlur={() => { if(!newLabel.trim()) setIsAddingLabel(false); }}
                          placeholder="Label name..."
                          className="text-[11px] bg-transparent border border-emerald-500/50 rounded-md px-2 py-1 focus:outline-none w-24"
                        />
                      ) : (
                        <button onClick={() => setIsAddingLabel(true)} className="text-[11px] font-semibold px-2 py-1 rounded-md border border-dashed border-border hover:border-emerald-500/50 text-muted transition flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div>
                    <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5" /> Subtasks</span>
                      <span className="text-[10px] font-normal lowercase">({selectedTask.subtasks?.filter(s=>s.completed).length || 0}/{selectedTask.subtasks?.length || 0})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {selectedTask.subtasks?.map(sub => (
                        <div key={sub.id} className="flex items-start gap-2 group p-1.5 rounded-lg hover:bg-foreground/[0.03] transition">
                          <button onClick={() => {
                            const updated = selectedTask.subtasks!.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s);
                            updateTask(selectedTask.id, { subtasks: updated });
                          }} className="mt-0.5 text-muted hover:text-emerald-500 transition">
                            {sub.completed ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                          </button>
                          <span className={`text-[13.5px] flex-1 leading-snug ${sub.completed ? "line-through text-muted" : ""}`}>
                            {sub.title}
                          </span>
                          <button onClick={() => {
                            const updated = selectedTask.subtasks!.filter(s => s.id !== sub.id);
                            updateTask(selectedTask.id, { subtasks: updated });
                          }} className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition p-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      
                      {addingSubtask ? (
                        <div className="flex items-center gap-2 mt-2 p-1.5">
                          <Square className="w-4 h-4 text-muted" />
                          <input
                            type="text" autoFocus value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newSubtask.trim()) {
                                const updated = [...(selectedTask.subtasks || []), { id: Date.now().toString(), title: newSubtask.trim(), completed: false }];
                                updateTask(selectedTask.id, { subtasks: updated });
                                setNewSubtask(""); 
                              }
                              if (e.key === "Escape") setAddingSubtask(false);
                            }}
                            placeholder="Subtask title... (Press Enter)"
                            className="flex-1 bg-transparent border-b border-emerald-500 text-[13.5px] py-1 focus:outline-none"
                          />
                          <button onClick={() => setAddingSubtask(false)} className="text-muted"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingSubtask(true)} className="text-[13px] text-muted hover:text-emerald-500 font-medium hover:underline flex items-center gap-2 mt-2 p-1.5">
                          <Plus className="w-4 h-4" /> Add subtask
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meta Data */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Due Date
                      </h4>
                      <input 
                        type="date"
                        value={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ""}
                        onChange={(e) => updateTask(selectedTask.id, { dueDate: e.target.value })}
                        className={`text-[13px] font-medium bg-transparent border border-transparent hover:border-border rounded px-2 py-1 -ml-2 focus:border-emerald-500 focus:outline-none transition-colors ${getDueDateColor(selectedTask.dueDate)}`}
                      />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Assignee
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30">
                          {selectedTask.assignee?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <select
                          value={selectedTask.assigneeId || ""}
                          onChange={(e) => updateTask(selectedTask.id, { assigneeId: e.target.value || null })}
                          className="text-[13px] font-medium bg-transparent border border-transparent hover:border-border rounded px-1 -ml-1 py-0.5 focus:border-emerald-500 focus:outline-none transition-colors w-full max-w-[150px] truncate"
                        >
                          <option value="">Unassigned</option>
                          {team.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                          {team.length === 0 && selectedTask.assignee && (
                            <option value={selectedTask.assignee.id}>{selectedTask.assignee.name}</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Sidebar */}
              <div className="w-full md:w-80 flex flex-col bg-foreground/[0.01] border-t md:border-t-0 md:border-l border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" /> Comments
                  </h4>
                  <button onClick={() => setSelectedTask(null)} className="p-1 rounded-lg hover:bg-foreground/[0.06] transition flex-shrink-0 hidden md:block">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedTask.comments?.map(comment => (
                    <div key={comment.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                        {comment.user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[12px] font-semibold">{comment.user.name}</span>
                          <span className="text-[10px] text-muted">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[12.5px] text-foreground/80 leading-relaxed bg-foreground/[0.03] rounded-lg rounded-tl-sm p-2.5">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                    <p className="text-center text-[12px] text-muted py-8">No comments yet.</p>
                  )}
                </div>

                <div className="p-3 border-t border-border bg-card">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newComment.trim()) return;
                    const comment = { id: Date.now().toString(), content: newComment.trim(), createdAt: new Date().toISOString(), user: { name: session?.user?.name || "User", image: session?.user?.image || null } };
                    const updated = [...(selectedTask.comments || []), comment];
                    updateTask(selectedTask.id, { comments: updated });
                    setNewComment("");
                  }} className="relative">
                    <input
                      ref={commentInputRef}
                      type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full rounded-xl border border-border bg-foreground/[0.04] pl-3 pr-10 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition"
                    />
                    <button type="submit" disabled={!newComment.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg disabled:opacity-50 transition">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
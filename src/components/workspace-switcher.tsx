"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Check,
  Building2,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  role: string;
  memberCount: number;
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/workspaces", { cache: "no-store" });
      const data = await res.json();
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
        setCurrentId(data.currentId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function switchTo(id: string) {
    if (id === currentId) {
      setOpen(false);
      return;
    }
    setSwitching(id);
    try {
      const res = await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: id }),
      });
      if (res.ok) {
        setCurrentId(id);
        setOpen(false);
        toast.success("Workspace switched");
        router.refresh();
        // Reload data on current page
        setTimeout(() => router.refresh(), 100);
      } else {
        toast.error("Failed to switch");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to switch");
    } finally {
      setSwitching(null);
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");

      const created = await res.json();
      setNewName("");
      setShowCreate(false);
      setOpen(false);
      toast.success("Workspace created");

      // Switch to the new one
      await switchTo(created.id);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  const current = workspaces.find((w) => w.id === currentId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-foreground/5 transition text-left group"
      >
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {loading || !current ? (
            <div className="h-3.5 rounded bg-foreground/5 w-24 animate-pulse" />
          ) : (
            <>
              <p className="text-sm font-medium truncate leading-tight">
                {current.name}
              </p>
              <p className="text-[10px] text-muted leading-tight mt-0.5">
                {current.memberCount}{" "}
                {current.memberCount === 1 ? "member" : "members"}
              </p>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden"
            >
              <div className="max-h-72 overflow-y-auto py-1">
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => switchTo(w.id)}
                    disabled={switching === w.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-foreground/5 transition text-left disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-md bg-foreground/5 border border-border flex items-center justify-center flex-shrink-0 text-[10px] font-semibold">
                      {w.name[0]?.toUpperCase() || "W"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {w.name}
                      </p>
                      <p className="text-[10px] text-muted leading-tight mt-0.5">
                        {w.memberCount}{" "}
                        {w.memberCount === 1 ? "member" : "members"} •{" "}
                        {w.role.toLowerCase()}
                      </p>
                    </div>
                    {switching === w.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted flex-shrink-0" />
                    ) : w.id === currentId ? (
                      <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="border-t border-border p-1">
                <button
                  onClick={() => {
                    setShowCreate(true);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-foreground/5 transition text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-foreground/5 border border-border border-dashed flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-muted" />
                  </div>
                  <span className="text-sm font-medium">
                    Create workspace
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create workspace modal */}
      <AnimatePresence>
        {showCreate && (
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted/40" />
              </div>

              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" />
                  New workspace
                </h3>
                <button
                  onClick={() => !creating && setShowCreate(false)}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={createWorkspace} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80">
                    Workspace name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="e.g. Design Team"
                  />
                </div>

                <p className="text-xs text-muted">
                  You&apos;ll be the owner. Invite members once created.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    disabled={creating}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-foreground/5 transition text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
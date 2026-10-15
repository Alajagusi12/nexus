"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ListChecks,
  Loader2,
  Copy,
  Check,
  Plus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type ActionItem = {
  title: string;
  description: string;
};

type Props = {
  conversationId: string;
  conversationName: string;
  onClose: () => void;
};

export function AIPanel({ conversationId, conversationName, onClose }: Props) {
  const [tab, setTab] = useState<"summary" | "actions">("summary");

  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [items, setItems] = useState<ActionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [createdItems, setCreatedItems] = useState<number[]>([]);
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tab === "summary" && !summary && !loadingSummary) {
      loadSummary();
    }
    if (tab === "actions" && items.length === 0 && !loadingItems) {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function loadSummary() {
    setLoadingSummary(true);
    setSummaryError("");
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error || "Failed to summarize");
        return;
      }
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to summarize");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadItems() {
    setLoadingItems(true);
    setItemsError("");
    try {
      const res = await fetch("/api/ai/action-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setItemsError(data.error || "Failed to extract items");
        return;
      }
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setItemsError("Failed to extract items");
    } finally {
      setLoadingItems(false);
    }
  }

  async function createTask(index: number) {
    const item = items[index];
    if (!item) return;

    setCreatingIndex(index);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          priority: "MEDIUM",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      setCreatedItems((prev) => [...prev, index]);
      toast.success("Task created");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create task");
    } finally {
      setCreatingIndex(null);
    }
  }

  async function copySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  function renderSummary() {
    if (!summary) return null;

    // Very light formatting: bold **text**, bullets starting with "-"
    const lines = summary.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();

      if (!trimmed) return <div key={i} className="h-2" />;

      // Heading-like: **text** alone on a line
      const headingMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
      if (headingMatch) {
        return (
          <h4
            key={i}
            className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0"
          >
            {headingMatch[1]}
          </h4>
        );
      }

      // Bullet: - text
      if (trimmed.startsWith("- ")) {
        return (
          <div key={i} className="flex gap-2 text-sm text-foreground/80 mb-1">
            <span className="text-blue-500 flex-shrink-0">•</span>
            <span>{trimmed.slice(2)}</span>
          </div>
        );
      }

      // Numbered: 1. text
      const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
      if (numMatch) {
        return (
          <div key={i} className="flex gap-2 text-sm text-foreground/80 mb-1">
            <span className="text-blue-500 font-medium flex-shrink-0">
              {numMatch[1]}.
            </span>
            <span>{numMatch[2]}</span>
          </div>
        );
      }

      // Regular paragraph — apply inline bold
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/);
      return (
        <p
          key={i}
          className="text-sm text-foreground/80 leading-relaxed mb-2"
        >
          {parts.map((part, j) => {
            const m = part.match(/^\*\*(.+?)\*\*$/);
            if (m) {
              return (
                <strong key={j} className="font-semibold text-foreground">
                  {m[1]}
                </strong>
              );
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed md:relative right-0 top-0 h-full w-full md:w-96 border-l border-border bg-background flex flex-col z-50 md:z-0 shadow-2xl md:shadow-none"
      >
        <header className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            AI Assistant
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-4 pt-3 pb-2 border-b border-border flex-shrink-0">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-2">
            {conversationName}
          </p>
          <div className="flex gap-1 p-1 rounded-lg bg-foreground/5">
            <button
              onClick={() => setTab("summary")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition ${
                tab === "summary"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Summary
            </button>
            <button
              onClick={() => setTab("actions")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition ${
                tab === "actions"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <ListChecks className="w-3 h-3" />
              Action items
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "summary" && (
            <>
              {loadingSummary && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-3" />
                  <p className="text-sm text-muted">
                    Reading the conversation...
                  </p>
                </div>
              )}

              {summaryError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Couldn&apos;t summarize</p>
                    <p className="text-xs opacity-80">{summaryError}</p>
                  </div>
                </div>
              )}

              {summary && !loadingSummary && (
                <>
                  <div className="mb-3">{renderSummary()}</div>

                  <button
                    onClick={copySummary}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-foreground/5 transition text-xs font-medium mt-4"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy summary
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}

          {tab === "actions" && (
            <>
              {loadingItems && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-3" />
                  <p className="text-sm text-muted">
                    Finding action items...
                  </p>
                </div>
              )}

              {itemsError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Couldn&apos;t extract</p>
                    <p className="text-xs opacity-80">{itemsError}</p>
                  </div>
                </div>
              )}

              {!loadingItems && !itemsError && items.length === 0 && (
                <div className="text-center py-16">
                  <ListChecks className="w-10 h-10 text-muted opacity-40 mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">No action items</p>
                  <p className="text-xs text-muted">
                    The AI didn&apos;t find any tasks to create.
                  </p>
                </div>
              )}

              {!loadingItems && items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, i) => {
                    const created = createdItems.includes(i);
                    const creating = creatingIndex === i;

                    return (
                      <div
                        key={i}
                        className={`rounded-xl border p-3 transition ${
                          created
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-border bg-foreground/[0.02] dark:bg-foreground/5"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted mb-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <button
                          onClick={() => createTask(i)}
                          disabled={created || creating}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                            created
                              ? "bg-green-500/10 text-green-500 border border-green-500/30"
                              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500"
                          } disabled:opacity-60`}
                        >
                          {creating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Creating...
                            </>
                          ) : created ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Added as task
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Create task
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
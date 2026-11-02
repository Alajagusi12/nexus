"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, FileText, Trash2, Loader2, Bold, Italic, Heading1, Heading2,
  List, ListOrdered, Quote, Undo, Redo, Check, ArrowLeft, MoreVertical,
  X, Clock, AlignLeft, Search, Highlighter, Command, Edit3, Code,
  Maximize2, Minimize2, Download, FileDown, Eye
} from "lucide-react";

type Document = {
  id: string;
  title: string;
  content?: string;
  updatedAt: string;
  createdAt: string;
};

function stripHtml(html: string) {
  if (typeof window === "undefined") return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  
  // UI State
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  
  // Content Stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSaved = useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      Highlight.configure({ multicolor: true }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm md:prose-base max-w-none focus:outline-none min-h-[60vh] text-foreground leading-relaxed",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "/" && view.state.selection.empty) {
          setShowSlashMenu(true);
        }
        if (event.key === "Escape" || event.key === " ") {
          setShowSlashMenu(false);
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      scheduleSave(html);
      updateStats(editor.getText());
    },
  });

  function updateStats(text: string) {
    if (!text) { setWordCount(0); setCharCount(0); return; }
    const words = text.trim().split(/\s+/).filter((w) => w && w.length > 0);
    setWordCount(words.length);
    setCharCount(text.length);
  }

  async function loadDocuments() {
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingDoc(true);
    fetch(`/api/documents/${activeId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setActiveDoc(data);
        setTitle(data.title || "Untitled Document");
        lastSaved.current = data.content || "";
        if (editor && data.content !== undefined) {
          editor.commands.setContent(data.content || "");
          updateStats(stripHtml(data.content || ""));
        }
        setLoadingDoc(false);
      })
      .catch(() => setLoadingDoc(false));
  }, [activeId, editor]);

  const scheduleSave = useCallback((html: string) => {
    if (!activeId) return;
    if (html === lastSaved.current) return;
    setSaveStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    saveTimeout.current = setTimeout(async () => {
      try {
        await fetch(`/api/documents/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: html }),
        });
        lastSaved.current = html;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        console.error(err);
        toast.error("Failed to save document");
      }
    }, 800);
  }, [activeId]);

  // Global Shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editor && activeId) {
          const html = editor.getHTML();
          setSaveStatus("saving");
          fetch(`/api/documents/${activeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: html }),
          }).then(() => {
            lastSaved.current = html;
            setSaveStatus("saved");
            toast.success("Document saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          });
        }
      }
      if (e.key === "Escape") {
        setShowSlashMenu(false);
        setShowStats(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, activeId]);

  async function saveTitle(newTitle: string) {
    if (!activeId || newTitle === activeDoc?.title) return;
    setSaveStatus("saving");
    try {
      await fetch(`/api/documents/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      setSaveStatus("saved");
      loadDocuments();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  async function createDocument() {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });
      const data = await res.json();
      await loadDocuments();
      setActiveId(data.id);
      setShowMobileSidebar(false);
      setShowDocMenu(false);
      toast.success("Document created");
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteDocument(docId: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeId === docId) {
        setActiveId(null);
        setActiveDoc(null);
      }
      setShowDocMenu(false);
      toast.success("Document deleted");
    } catch (err) {
      console.error(err);
    }
  }

  function exportMarkdown() {
    if (!activeDoc || !editor) return;
    const md = editor.getText();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.title || "Untitled"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  }

  function exportPDF() {
    window.print();
  }

  function selectDocument(id: string) {
    setActiveId(id);
    setShowMobileSidebar(false);
  }

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const Sidebar = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <h2 className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" /> Documents
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={createDocument} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] text-muted hover:text-foreground transition" title="New Document">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setShowMobileSidebar(false)} className="md:hidden p-1.5 rounded-lg hover:bg-foreground/[0.06] transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!loading && documents.length > 3 && (
        <div className="p-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search documents..."
              className="w-full rounded-lg border border-border bg-foreground/[0.04] pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-border/50 p-3 animate-pulse">
                <div className="h-3.5 rounded bg-foreground/5 mb-2 w-3/4" />
                <div className="h-3 rounded bg-foreground/5 w-1/3" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
              <FileText className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No documents yet</p>
            <p className="text-xs text-muted mb-4 leading-relaxed">Create your first one to get started.</p>
            <button onClick={createDocument} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition">
              <Plus className="w-3.5 h-3.5" /> New document
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 px-4 text-muted text-[13px]">No documents match &quot;{searchQuery}&quot;</div>
        ) : (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`group flex items-center gap-2 px-4 py-3 border-l-2 transition cursor-pointer ${
                activeId === doc.id ? "bg-foreground/[0.04] border-emerald-500" : "hover:bg-foreground/[0.02] border-transparent"
              }`}
              onClick={() => selectDocument(doc.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isToday(doc.updatedAt) ? "bg-emerald-500" : "bg-muted/40"}`} />
                  <p className="text-[13.5px] font-medium truncate text-foreground">{doc.title || "Untitled"}</p>
                </div>
                <p className="text-[11.5px] text-muted flex items-center gap-1 ml-3.5">
                  <Clock className="w-3 h-3" /> {timeAgo(doc.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 transition flex-shrink-0" title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-full relative bg-background">
      {/* Desktop sidebar */}
      {!focusMode && (
        <aside className="hidden md:flex w-72 border-r border-border flex-col flex-shrink-0 bg-background transition-all duration-300">
          {Sidebar}
        </aside>
      )}

      {/* Mobile sidebar */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileSidebar(false)} className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="md:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border flex flex-col z-50 pb-20">
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main editor */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {activeDoc ? (
          <>
            {/* Header */}
            <div className={`border-b border-border px-3 md:px-6 py-3 flex items-center gap-2 md:gap-3 flex-shrink-0 bg-background z-10 ${focusMode ? "opacity-50 hover:opacity-100 transition-opacity" : ""}`}>
              <button onClick={() => setShowMobileSidebar(true)} className="md:hidden p-2 -ml-1 rounded-lg hover:bg-foreground/[0.06] transition flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>

              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={(e) => saveTitle(e.target.value)}
                className="text-lg md:text-xl font-bold tracking-tight bg-transparent border-none focus:outline-none flex-1 min-w-0 placeholder:text-muted"
                placeholder="Untitled Document"
              />

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <AnimatePresence>
                  {saveStatus === "saving" && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden sm:flex text-[11px] font-medium text-muted items-center gap-1.5 bg-foreground/[0.04] px-2 py-1 rounded-md">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                    </motion.span>
                  )}
                  {saveStatus === "saved" && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden sm:flex text-[11px] font-medium text-emerald-500 items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
                      <Check className="w-3 h-3" /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <button onClick={() => setShowStats(!showStats)} className={`p-1.5 rounded-lg transition ${showStats ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.06]"}`} title="Statistics">
                    <AlignLeft className="w-4 h-4 text-muted" />
                  </button>
                  {showStats && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowStats(false)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl p-3 z-50">
                        <div className="space-y-2 text-[12px]">
                          <div className="flex justify-between"><span className="text-muted">Words</span><span className="font-semibold">{wordCount}</span></div>
                          <div className="flex justify-between"><span className="text-muted">Characters</span><span className="font-semibold">{charCount}</span></div>
                          <div className="flex justify-between"><span className="text-muted">Read time</span><span className="font-semibold">{Math.max(1, Math.ceil(wordCount / 200))} min</span></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button onClick={() => setFocusMode(!focusMode)} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] transition hidden sm:block" title="Focus Mode">
                  {focusMode ? <Minimize2 className="w-4 h-4 text-muted" /> : <Maximize2 className="w-4 h-4 text-muted" />}
                </button>

                <button onClick={exportMarkdown} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] transition hidden sm:block" title="Export as Markdown">
                  <Download className="w-4 h-4 text-muted" />
                </button>
                
                <button onClick={exportPDF} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] transition hidden sm:block" title="Export as PDF">
                  <FileDown className="w-4 h-4 text-muted" />
                </button>

                <button onClick={() => setShowDocMenu(!showDocMenu)} className="md:hidden p-2 rounded-lg hover:bg-foreground/[0.06] transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Floating Toolbar */}
            {!focusMode && (
              <div className="border-b border-border px-3 md:px-6 py-2 flex items-center justify-center flex-shrink-0 overflow-x-auto bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-0.5 md:gap-1 bg-foreground/[0.03] border border-border rounded-xl p-1 shadow-sm">
                  <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} icon={Bold} title="Bold" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} icon={Italic} title="Italic" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} icon={Highlighter} title="Highlight" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} icon={Code} title="Inline Code" />
                  <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} icon={Heading1} title="Heading 1" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} icon={Heading2} title="Heading 2" />
                  <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} icon={List} title="Bullet List" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} icon={ListOrdered} title="Numbered List" />
                  <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} icon={Quote} title="Quote" />
                  <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />
                  <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} icon={Undo} title="Undo" />
                  <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} icon={Redo} title="Redo" />
                </div>
              </div>
            )}

            {/* Editor content */}
            <div className={`flex-1 overflow-y-auto px-4 md:px-12 py-6 md:py-12 pb-24 md:pb-12 relative ${focusMode ? "max-w-4xl mx-auto w-full" : ""}`}>
              <div className="max-w-3xl mx-auto w-full">
                {loadingDoc ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-6 rounded bg-foreground/5 w-1/2" />
                    <div className="h-4 rounded bg-foreground/5 w-full" />
                    <div className="h-4 rounded bg-foreground/5 w-5/6" />
                    <div className="h-4 rounded bg-foreground/5 w-2/3" />
                  </div>
                ) : (
                  <EditorContent editor={editor} />
                )}
              </div>

              {/* Slash Command Menu */}
              <AnimatePresence>
                {showSlashMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSlashMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 bg-card border border-border shadow-2xl rounded-xl z-50 overflow-hidden"
                    >
                      <div className="p-2 border-b border-border bg-foreground/[0.02]">
                        <p className="text-[10px] font-semibold text-muted uppercase tracking-wider px-2 py-1 flex items-center gap-2">
                          <Command className="w-3 h-3" /> Basic Blocks
                        </p>
                      </div>
                      <div className="p-1 max-h-64 overflow-y-auto">
                        <button onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowSlashMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.06] text-left transition">
                          <Heading1 className="w-4 h-4 text-muted" /> <span className="text-[13px] font-medium">Heading 1</span>
                        </button>
                        <button onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowSlashMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.06] text-left transition">
                          <Heading2 className="w-4 h-4 text-muted" /> <span className="text-[13px] font-medium">Heading 2</span>
                        </button>
                        <button onClick={() => { editor.chain().focus().toggleBulletList().run(); setShowSlashMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.06] text-left transition">
                          <List className="w-4 h-4 text-muted" /> <span className="text-[13px] font-medium">Bullet List</span>
                        </button>
                        <button onClick={() => { editor.chain().focus().toggleOrderedList().run(); setShowSlashMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.06] text-left transition">
                          <ListOrdered className="w-4 h-4 text-muted" /> <span className="text-[13px] font-medium">Numbered List</span>
                        </button>
                        <button onClick={() => { editor.chain().focus().toggleBlockquote().run(); setShowSlashMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.06] text-left transition">
                          <Quote className="w-4 h-4 text-muted" /> <span className="text-[13px] font-medium">Quote</span>
                        </button>
                        <button onClick={() => { editor.chain().focus().toggleCodeBlock().run(); setShowSlashMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/[0.06] text-left transition">
                          <Code className="w-4 h-4 text-muted" /> <span className="text-[13px] font-medium">Code Block</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              
              {/* Footer Info */}
              <div className="max-w-3xl mx-auto w-full mt-12 pt-6 border-t border-border flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Last edited {timeAgo(activeDoc.updatedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" />
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
              </div>
            </div>

            {/* Mobile Footer Bar */}
            <div className="md:hidden border-t border-border px-4 py-2 flex items-center justify-between text-[10px] font-medium text-muted flex-shrink-0 pb-20 bg-background">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3 h-3" /> Edited {timeAgo(activeDoc.updatedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> {Math.max(1, Math.ceil(wordCount / 200))} min read
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted px-6 pb-20 md:pb-0">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <FileText className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5 tracking-tight">No document selected</h3>
              <p className="text-[13.5px] text-muted mb-6">Pick one from the list or start a new one.</p>
              <button onClick={createDocument} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-white text-[13.5px] font-semibold hover:bg-emerald-600 transition shadow-sm">
                <Plus className="w-4 h-4" /> New document
              </button>
              <button onClick={() => setShowMobileSidebar(true)} className="md:hidden mt-4 text-xs font-medium text-emerald-500 hover:text-emerald-400 transition block mx-auto">
                Or browse existing documents →
              </button>
            </div>
          </div>
        )}

        {/* Floating Action Button (FAB) for Mobile */}
        <AnimatePresence>
          {!activeId && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={createDocument}
              className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-xl flex items-center justify-center z-50 hover:bg-emerald-600 transition active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, active, icon: Icon, title }: { onClick: () => void; active: boolean; icon: any; title: string; }) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 md:p-2 rounded-lg transition flex-shrink-0 ${active ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "text-muted hover:bg-foreground/[0.06] hover:text-foreground"}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
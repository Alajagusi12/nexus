"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  Trash2,
  Loader2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Check,
  ArrowLeft,
  MoreVertical,
  X,
} from "lucide-react";

type Document = {
  id: string;
  title: string;
  content?: string;
  updatedAt: string;
  createdAt: string;
};

export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">(
    "idle"
  );
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSaved = useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm md:prose-base max-w-none focus:outline-none min-h-[60vh] text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      scheduleSave(editor.getHTML());
    },
  });

  async function loadDocuments() {
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
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
        }
        setLoadingDoc(false);
      })
      .catch(() => setLoadingDoc(false));
  }, [activeId, editor]);

  const scheduleSave = useCallback(
    (html: string) => {
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
          setTimeout(() => setSaveStatus("idle"), 1500);
        } catch (err) {
          console.error(err);
        }
      }, 800);
    },
    [activeId]
  );

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
      setTimeout(() => setSaveStatus("idle"), 1500);
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
    } catch (err) {
      console.error(err);
    }
  }

  function selectDocument(id: string) {
    setActiveId(id);
    setShowMobileSidebar(false);
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const Sidebar = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" />
          Documents
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={createDocument}
            className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
            title="New Document"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-foreground/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 px-4 text-muted text-sm">
            <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5 text-muted" />
            </div>
            <p className="font-medium mb-1">No documents yet</p>
            <p className="text-xs mb-4">Create your first one to get started</p>
            <button
              onClick={createDocument}
              className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 transition font-medium"
            >
              <Plus className="w-3 h-3" />
              New document
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`group flex items-center gap-2 p-3 border-b border-border/50 transition cursor-pointer ${
                activeId === doc.id
                  ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                  : "hover:bg-foreground/5 border-l-2 border-l-transparent"
              }`}
              onClick={() => selectDocument(doc.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {doc.title || "Untitled"}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(doc.updatedAt).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDocument(doc.id);
                }}
                className="opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition flex-shrink-0"
                title="Delete"
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
    <div className="flex h-full relative">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 border-r border-border flex-col flex-shrink-0 bg-background">
        {Sidebar}
      </aside>

      {/* Mobile sidebar (slide over) */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border flex flex-col z-50 pb-20"
            >
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeDoc ? (
          <>
            {/* Header */}
            <div className="border-b border-border px-3 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-foreground/10 transition flex-shrink-0"
                title="All documents"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={(e) => saveTitle(e.target.value)}
                className="text-base md:text-xl font-semibold bg-transparent border-none focus:outline-none flex-1 min-w-0"
                placeholder="Untitled Document"
              />

              <div className="flex items-center gap-2 flex-shrink-0">
                <AnimatePresence>
                  {saveStatus === "saving" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hidden sm:flex text-xs text-muted items-center gap-1"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving...
                    </motion.span>
                  )}
                  {saveStatus === "saved" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hidden sm:flex text-xs text-green-500 items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setShowDocMenu(!showDocMenu)}
                  className="md:hidden p-2 rounded-lg hover:bg-foreground/10 transition"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile menu */}
              <AnimatePresence>
                {showDocMenu && (
                  <>
                    <div
                      className="md:hidden fixed inset-0 z-40"
                      onClick={() => setShowDocMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="md:hidden absolute right-3 top-16 w-48 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          deleteDocument(activeDoc.id);
                          setShowDocMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-500/10 transition text-left text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete document
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Toolbar */}
            <div className="border-b border-border px-2 md:px-6 py-1.5 md:py-2 flex items-center gap-0.5 md:gap-1 flex-shrink-0 overflow-x-auto">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                icon={Bold}
                title="Bold"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                icon={Italic}
                title="Italic"
              />
              <div className="w-px h-5 bg-border mx-0.5 md:mx-1 flex-shrink-0" />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                active={editor.isActive("heading", { level: 1 })}
                icon={Heading1}
                title="Heading 1"
              />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                active={editor.isActive("heading", { level: 2 })}
                icon={Heading2}
                title="Heading 2"
              />
              <div className="w-px h-5 bg-border mx-0.5 md:mx-1 flex-shrink-0" />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                icon={List}
                title="Bullet List"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                icon={ListOrdered}
                title="Numbered List"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive("blockquote")}
                icon={Quote}
                title="Quote"
              />
              <div className="w-px h-5 bg-border mx-0.5 md:mx-1 flex-shrink-0" />
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                active={false}
                icon={Undo}
                title="Undo"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                active={false}
                icon={Redo}
                title="Redo"
              />
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
              <div className="max-w-3xl mx-auto w-full">
                {loadingDoc ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <EditorContent editor={editor} />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted px-6 pb-20 md:pb-0">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-foreground/5 border border-border/50 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 md:w-10 md:h-10 text-muted opacity-60" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-1.5">
                No document selected
              </h3>
              <p className="text-sm text-muted mb-6">
                Pick one from the list or start a new one.
              </p>
              <button
                onClick={createDocument}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-2 mx-auto text-sm"
              >
                <Plus className="w-4 h-4" />
                New document
              </button>
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden mt-3 text-xs text-muted hover:text-foreground transition block mx-auto"
              >
                Or browse existing →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  active: boolean;
  icon: any;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition flex-shrink-0 ${
        active
          ? "bg-blue-500/20 text-blue-500"
          : "text-muted hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
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
          "prose prose-invert max-w-none focus:outline-none min-h-[500px] text-slate-200",
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
    } catch (err) {
      console.error(err);
    }
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <aside className="w-72 border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </h2>
          <button
            onClick={createDocument}
            className="p-1.5 rounded-lg hover:bg-white/10 transition"
            title="New Document"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-500 text-sm">
              No documents yet.
              <br />
              Click + to create one.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-2 p-3 border-b border-white/5 transition ${
                  activeId === doc.id ? "bg-blue-500/10" : "hover:bg-white/5"
                }`}
              >
                <button
                  onClick={() => setActiveId(doc.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {activeDoc ? (
          <>
            <div className="border-b border-white/10 px-6 py-4 flex items-center gap-3 flex-shrink-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={(e) => saveTitle(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none flex-1"
                placeholder="Untitled Document"
              />
              <AnimatePresence>
                {saveStatus === "saving" && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-slate-500 flex items-center gap-1"
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
                    className="text-xs text-green-400 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="border-b border-white/10 px-6 py-2 flex items-center gap-1 flex-shrink-0 flex-wrap">
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
              <div className="w-px h-6 bg-white/10 mx-1" />
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
              <div className="w-px h-6 bg-white/10 mx-1" />
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
              <div className="w-px h-6 bg-white/10 mx-1" />
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

            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              {loadingDoc ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <EditorContent editor={editor} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Select a document or create a new one</p>
              <button
                onClick={createDocument}
                className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-semibold hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                New Document
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
      className={`p-2 rounded-lg transition ${
        active
          ? "bg-blue-500/20 text-blue-400"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

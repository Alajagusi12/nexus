"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { signOut } from "next-auth/react";
import {
  Search,
  MessageSquare,
  Loader2,
  User,
  Settings,
  LogOut,
  CheckSquare,
  Users,
} from "lucide-react";

type SearchResults = {
  users: { id: string; name: string | null; email: string; image: string | null }[];
  tasks: { id: string; title: string; status: string }[];
  conversations: { id: string; name: string | null; isGroup: boolean }[];
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResults>({
    users: [],
    tasks: [],
    conversations: [],
  });
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
        setResults({ users: [], tasks: [], conversations: [] });
      }
    }
    window.addEventListener("open-command-palette", handleOpen);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("open-command-palette", handleOpen);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (search.length < 1) {
      setResults({ users: [], tasks: [], conversations: [] });
      return;
    }
    setSearching(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(search)}`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          setResults({
            users: data.users || [],
            tasks: data.tasks || [],
            conversations: data.conversations || [],
          });
          setSearching(false);
        })
        .catch(() => {
          setResults({ users: [], tasks: [], conversations: [] });
          setSearching(false);
        });
    }, 250);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [search, open]);

  async function startChatWith(userId: string) {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserIds: [userId] }), // Fixed to array for API
      });
      const data = await res.json();
      if (data.id) {
        setOpen(false);
        setSearch("");
        router.push("/dashboard/chat");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function goTo(path: string) {
    setOpen(false);
    setSearch("");
    router.push(path);
  }

  if (!open) return null;

  const hasResults =
    results.users.length > 0 ||
    results.tasks.length > 0 ||
    results.conversations.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={() => {
        setOpen(false);
        setSearch("");
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="text-foreground" shouldFilter={false}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted flex-shrink-0" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Search people, tasks, or chats..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none text-sm"
            />
            <kbd className="px-2 py-0.5 text-xs rounded border border-border bg-foreground/5 text-muted flex-shrink-0">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            {search.length < 1 ? (
              <Command.Group heading="Quick navigation" className="text-xs font-medium text-muted px-2 py-1">
                <Item onSelect={() => goTo("/dashboard")}>
                  <User className="w-4 h-4 text-muted" />
                  Dashboard
                </Item>
                <Item onSelect={() => goTo("/dashboard/chat")}>
                  <MessageSquare className="w-4 h-4 text-muted" />
                  Go to Chat
                </Item>
                <Item onSelect={() => goTo("/dashboard/settings")}>
                  <Settings className="w-4 h-4 text-muted" />
                  Settings
                </Item>
                <Item onSelect={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Sign out</span>
                </Item>
              </Command.Group>
            ) : searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              </div>
            ) : !hasResults ? (
              <div className="py-8 text-center text-sm text-muted">
                No results found for &quot;{search}&quot;
              </div>
            ) : (
              <>
                {results.users.length > 0 && (
                  <Command.Group heading="People" className="text-xs font-medium text-muted px-2 py-1 mt-2">
                    {results.users.map((user) => (
                      <Item key={user.id} onSelect={() => startChatWith(user.id)}>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0 text-white">
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                          <p className="text-xs text-muted truncate">{user.email}</p>
                        </div>
                        <MessageSquare className="w-4 h-4 text-muted" />
                      </Item>
                    ))}
                  </Command.Group>
                )}

                {results.conversations.length > 0 && (
                  <Command.Group heading="Conversations" className="text-xs font-medium text-muted px-2 py-1 mt-2">
                    {results.conversations.map((c) => (
                      <Item key={c.id} onSelect={() => goTo("/dashboard/chat")}>
                        {c.isGroup ? <Users className="w-4 h-4 text-emerald-500" /> : <MessageSquare className="w-4 h-4 text-emerald-500" />}
                        <span className="flex-1 truncate">{c.name || "Unnamed Chat"}</span>
                      </Item>
                    ))}
                  </Command.Group>
                )}

                {results.tasks.length > 0 && (
                  <Command.Group heading="Tasks" className="text-xs font-medium text-muted px-2 py-1 mt-2">
                    {results.tasks.map((t) => (
                      <Item key={t.id} onSelect={() => goTo("/dashboard/tasks")}>
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                        <span className="flex-1 truncate">{t.title}</span>
                        <span className="text-[10px] text-muted uppercase">{t.status}</span>
                      </Item>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>

          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted">
            <span>Search everywhere</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/5">ESC</kbd>
              close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function Item({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-foreground/80 data-[selected=true]:bg-foreground/10 data-[selected=true]:text-foreground transition select-none"
    >
      {children}
    </Command.Item>
  );
}
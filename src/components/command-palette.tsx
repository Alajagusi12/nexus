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
} from "lucide-react";

type OtherUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<OtherUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
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
        setResults([]);
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
      setResults([]);
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
          setResults(Array.isArray(data) ? data : []);
          setSearching(false);
        })
        .catch(() => {
          setResults([]);
          setSearching(false);
        });
    }, 250);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [search, open]);

  async function startChatWith(userId: string) {
    setStarting(userId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId }),
      });
      const data = await res.json();
      if (data.id) {
        setOpen(false);
        setSearch("");
        setResults([]);
        router.push("/dashboard/chat");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  }

  function goTo(path: string) {
    setOpen(false);
    setSearch("");
    setResults([]);
    router.push(path);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={() => {
        setOpen(false);
        setSearch("");
        setResults([]);
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="text-white"
          shouldFilter={false}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Search people by name or email..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
            />
            <kbd className="px-2 py-0.5 text-xs rounded border border-white/10 bg-white/5 text-slate-400 flex-shrink-0">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            {search.length < 1 ? (
              <Command.Group heading="Quick navigation">
                <Item onSelect={() => goTo("/dashboard")}>
                  <User className="w-4 h-4" />
                  Dashboard
                </Item>
                <Item onSelect={() => goTo("/dashboard/chat")}>
                  <MessageSquare className="w-4 h-4" />
                  Go to Chat
                </Item>
                <Item onSelect={() => goTo("/dashboard/settings")}>
                  <Settings className="w-4 h-4" />
                  Settings
                </Item>
                <Item
                  onSelect={() => {
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Item>
              </Command.Group>
            ) : searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : results.length === 0 ? (
              <Command.Empty className="py-8 text-center text-sm text-slate-500">
                No users found for &quot;{search}&quot;
              </Command.Empty>
            ) : (
              <Command.Group heading="People">
                {results.map((user) => (
                  <div
                    key={user.id}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startChatWith(user.id);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-slate-300 hover:bg-white/10 hover:text-white transition select-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 pointer-events-none">
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <p className="text-sm font-medium truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    {starting === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
            <span>Search people & start chats</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                  ESC
                </kbd>
                close
              </span>
            </div>
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
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer text-slate-300 data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition"
    >
      {children}
    </Command.Item>
  );
}
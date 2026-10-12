"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Loader2, X, Sparkles, Mail } from "lucide-react";
import { parseSkills } from "@/lib/skills";

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  skills: string | null;
  lastSeenAt: string | null;
};

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email[0].toUpperCase();
}

function formatLastSeen(lastSeenAt: string | null) {
  if (!lastSeenAt) return "Offline";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Online";
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Active ${days}d ago`;
}

function isOnline(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000;
}

export default function TeamPage() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const url = query.trim()
        ? `/api/users/search?q=${encodeURIComponent(query)}`
        : `/api/users/search?q=a`;
      fetch(url, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setMembers(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
          <Users className="w-7 h-7 text-blue-500" />
          Team
        </h1>
        <p className="text-muted text-sm md:text-base">
          Discover skills across your workspace
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-border bg-foreground/5 pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-muted">No members found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, i) => {
            const skills = parseSkills(member.skills);
            const online = isOnline(member.lastSeenAt);
            return (
              <motion.button
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(member)}
                className="text-left rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 hover:bg-foreground/5 dark:hover:bg-foreground/10 hover:border-border/80 transition group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden ring-2 ring-border/30">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(member.name, member.email)
                      )}
                    </div>
                    {online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {member.name || "Unnamed"}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {member.email}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        online ? "text-green-500" : "text-muted"
                      }`}
                    >
                      {formatLastSeen(member.lastSeenAt)}
                    </p>
                  </div>
                </div>

                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 dark:text-blue-300 border border-blue-500/20 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-muted font-medium">
                        +{skills.length - 4} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic">
                    No skills added yet
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-border bg-card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white overflow-hidden ring-2 ring-border/30 flex-shrink-0">
                {selected.image ? (
                  <img
                    src={selected.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(selected.name, selected.email)
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">
                  {selected.name || "Unnamed"}
                </h2>
                <p className="text-sm text-muted truncate flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {selected.email}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isOnline(selected.lastSeenAt)
                      ? "text-green-500"
                      : "text-muted"
                  }`}
                >
                  {formatLastSeen(selected.lastSeenAt)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground/80">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Skills ({parseSkills(selected.skills).length})
              </h3>
              {parseSkills(selected.skills).length === 0 ? (
                <p className="text-sm text-muted italic">
                  No skills added yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {parseSkills(selected.skills).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1.5 rounded-full bg-blue-500/15 text-blue-500 dark:text-blue-300 border border-blue-500/20 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
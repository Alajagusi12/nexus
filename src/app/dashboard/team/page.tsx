"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Loader2,
  X,
  Sparkles,
  Mail,
  UserPlus,
  Copy,
  Check,
  Filter,
  Zap,
  Award,
  Crown,
  Shield,
} from "lucide-react";
import { parseSkills } from "@/lib/skills";

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  skills: string | null;
  lastSeenAt: string | null;
  role: string;
  joinedAt: string;
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

function RoleBadge({ role }: { role: string }) {
  if (role === "OWNER") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
        <Crown className="w-2.5 h-2.5" />
        Owner
      </span>
    );
  }
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-purple-500/20 text-purple-500 border border-purple-500/30">
        <Shield className="w-2.5 h-2.5" />
        Admin
      </span>
    );
  }
  return null;
}

export default function TeamPage() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Member | null>(null);
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      try {
        const wsRes = await fetch("/api/workspaces", { cache: "no-store" });
        const wsData = await wsRes.json();
        const currentId = wsData.currentId;

        if (!currentId) {
          setMembers([]);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/workspaces/${currentId}/members`, {
          cache: "no-store",
        });
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, query]);

  const skillFilteredMembers = useMemo(() => {
    if (!skillFilter) return filteredMembers;
    return filteredMembers.filter((m) => {
      const skills = parseSkills(m.skills);
      return skills.includes(skillFilter);
    });
  }, [filteredMembers, skillFilter]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    members.forEach((m) => {
      parseSkills(m.skills).forEach((s) => skillSet.add(s));
    });
    return Array.from(skillSet).sort();
  }, [members]);

  const onlineCount = useMemo(
    () => members.filter((m) => isOnline(m.lastSeenAt)).length,
    [members]
  );

  async function generateInvite() {
    setInviteLoading(true);
    setInviteError("");
    setInviteLink(null);

    try {
      const wsRes = await fetch("/api/workspaces", { cache: "no-store" });
      const wsData = await wsRes.json();
      const currentId = wsData.currentId;

      if (!currentId) {
        setInviteError("No workspace found");
        setInviteLoading(false);
        return;
      }

      const res = await fetch(`/api/workspaces/${currentId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "MEMBER" }),
      });

      if (!res.ok) {
        const err = await res.json();
        setInviteError(err.error || "Failed to create invite");
        setInviteLoading(false);
        return;
      }

      const data = await res.json();
      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
    } catch (err) {
      console.error(err);
      setInviteError("Failed to create invite");
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  function closeInvite() {
    setShowInvite(false);
    setInviteLink(null);
    setInviteError("");
    setCopied(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-500" />
              Team
            </h1>
            <p className="text-muted text-sm md:text-base">
              {members.length} {members.length === 1 ? "member" : "members"}
              {onlineCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-green-500">{onlineCount} online</span>
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition flex items-center gap-2 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-border bg-foreground/5 pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className={`rounded-xl border px-3 md:px-4 py-2.5 text-sm font-medium transition flex items-center gap-2 flex-shrink-0 ${
            skillFilter
              ? "border-blue-500/50 bg-blue-500/10 text-blue-500"
              : "border-border bg-foreground/5 text-muted hover:bg-foreground/10"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">
            {skillFilter ? skillFilter : "Filter"}
          </span>
          {skillFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSkillFilter(null);
              }}
              className="ml-0.5 hover:opacity-70"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-foreground/[0.02] dark:bg-foreground/5 p-4 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-foreground/5" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 rounded bg-foreground/5 w-3/4" />
                  <div className="h-3 rounded bg-foreground/5 w-1/2" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 rounded-full bg-foreground/5 w-16" />
                <div className="h-5 rounded-full bg-foreground/5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : skillFilteredMembers.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted opacity-60" />
          </div>
          <p className="font-medium mb-1">
            {skillFilter ? "No one with that skill" : "No members found"}
          </p>
          <p className="text-sm text-muted mb-4">
            {skillFilter
              ? `Nobody has "${skillFilter}" yet. Try a different filter.`
              : members.length === 0
              ? "Invite someone to your workspace to get started."
              : "Try a different search."}
          </p>
          {skillFilter ? (
            <button
              onClick={() => setSkillFilter(null)}
              className="text-sm text-blue-500 hover:text-blue-400 transition font-medium"
            >
              Clear filter
            </button>
          ) : members.length === 0 ? (
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 transition font-medium"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite a member
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillFilteredMembers.map((member, i) => {
            const skills = parseSkills(member.skills);
            const online = isOnline(member.lastSeenAt);
            return (
              <motion.button
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
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
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-foreground truncate">
                        {member.name || "Unnamed"}
                      </p>
                      <RoleBadge role={member.role} />
                    </div>
                    <p className="text-xs text-muted truncate">
                      {member.email}
                    </p>
                    <p
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        online ? "text-green-500" : "text-muted"
                      }`}
                    >
                      {online && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
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

      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-lg rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted/40" />
              </div>

              <div className="p-6 relative">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-foreground/10 transition text-muted hover:text-foreground"
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
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h2 className="text-xl font-bold truncate">
                        {selected.name || "Unnamed"}
                      </h2>
                      <RoleBadge role={selected.role} />
                    </div>
                    <p className="text-sm text-muted truncate flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {selected.email}
                    </p>
                    <p
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        isOnline(selected.lastSeenAt)
                          ? "text-green-500"
                          : "text-muted"
                      }`}
                    >
                      {isOnline(selected.lastSeenAt) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilters && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted/40" />
              </div>

              <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter by skill
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {allSkills.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">
                    No skills in your workspace yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSkillFilter(null);
                        setShowFilters(false);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                        !skillFilter
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-border bg-foreground/5 hover:bg-foreground/10"
                      }`}
                    >
                      All members
                    </button>
                    {allSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => {
                          setSkillFilter(skill);
                          setShowFilters(false);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                          skillFilter === skill
                            ? "bg-blue-500 text-white border-blue-500"
                            : "border-border bg-foreground/5 hover:bg-foreground/10"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvite && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={closeInvite}
          >
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted/40" />
              </div>

              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-500" />
                  Invite to workspace
                </h3>
                <button
                  onClick={closeInvite}
                  className="p-1.5 rounded-lg hover:bg-foreground/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6 text-blue-500" />
                </div>

                <p className="text-sm text-muted text-center">
                  Share this link with anyone you want in your workspace.
                  They&apos;ll create an account and join you.
                </p>

                {!inviteLink && !inviteLoading && (
                  <button
                    onClick={generateInvite}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Generate invite link
                  </button>
                )}

                {inviteLoading && (
                  <div className="text-center py-3 text-sm text-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </div>
                )}

                {inviteError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 text-sm">
                    {inviteError}
                  </div>
                )}

                {inviteLink && (
                  <>
                    <div className="rounded-xl border border-border bg-foreground/5 p-3">
                      <p className="text-[10px] text-muted mb-1.5 uppercase tracking-wider">
                        Invite link — expires in 7 days
                      </p>
                      <p className="text-xs text-foreground/80 break-all font-mono">
                        {inviteLink}
                      </p>
                    </div>

                    <button
                      onClick={copyInviteLink}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy invite link
                        </>
                      )}
                    </button>
                  </>
                )}

                <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Beta: no per-seat limits
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
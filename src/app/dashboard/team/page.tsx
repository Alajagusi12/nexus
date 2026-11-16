"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Loader2, X, Sparkles, Mail, UserPlus, Copy,
  Check, Filter, Zap, Award, Crown, Shield, MessageSquare
} from "lucide-react";
import { parseSkills } from "@/lib/skills";
import Link from "next/link";

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
    return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
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
      <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20">
        <Crown className="w-3 h-3" /> Owner
      </span>
    );
  }
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
        <Shield className="w-3 h-3" /> Admin
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

        const res = await fetch(`/api/workspaces/${currentId}/members`, { cache: "no-store" });
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
    return members.filter((m) => m.name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
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

  const onlineCount = useMemo(() => members.filter((m) => isOnline(m.lastSeenAt)).length, [members]);

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
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-500" />
            Team Directory
          </h1>
          <p className="text-[14px] text-muted flex items-center gap-2">
            {members.length} {members.length === 1 ? "member" : "members"}
            {onlineCount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {onlineCount} online now
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => setShowInvite(true)}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-white text-[13px] font-semibold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className={`h-11 rounded-xl border px-4 text-[13px] font-medium transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-sm ${
            skillFilter
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border bg-card text-muted hover:text-foreground hover:bg-foreground/[0.02]"
          }`}
        >
          <Filter className="w-4 h-4" />
          {skillFilter ? skillFilter : "Filter by Skill"}
          {skillFilter && (
            <button
              onClick={(e) => { e.stopPropagation(); setSkillFilter(null); }}
              className="ml-1 hover:opacity-70 p-0.5 rounded-full hover:bg-emerald-500/20 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-foreground/[0.04]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 rounded bg-foreground/[0.04] w-3/4" />
                  <div className="h-3 rounded bg-foreground/[0.04] w-1/2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 rounded-md bg-foreground/[0.04] w-16" />
                <div className="h-6 rounded-md bg-foreground/[0.04] w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : skillFilteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6 border border-border border-dashed rounded-3xl bg-foreground/[0.01]">
          <div className="w-16 h-16 rounded-2xl bg-foreground/[0.04] flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted" />
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">
            {skillFilter ? "No one with that skill" : "No members found"}
          </p>
          <p className="text-[13px] text-muted mb-5">
            {skillFilter ? `Nobody has "${skillFilter}" yet. Try a different filter.` : members.length === 0 ? "Invite someone to your workspace to get started." : "Try a different search."}
          </p>
          {skillFilter ? (
            <button onClick={() => setSkillFilter(null)} className="px-4 py-2 rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition">
              Clear filter
            </button>
          ) : members.length === 0 ? (
            <button onClick={() => setShowInvite(true)} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition shadow-sm">
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
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-emerald-500/30 hover:shadow-md transition-all flex flex-col"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden border-2 shadow-sm ${online ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-border"}`}>
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        {member.image ? <img src={member.image} alt="" className="w-full h-full object-cover" /> : getInitials(member.name, member.email)}
                      </div>
                    </div>
                    {online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-[15px] font-bold text-foreground truncate">{member.name || "Unnamed"}</p>
                      <RoleBadge role={member.role} />
                    </div>
                    <p className="text-[12.5px] text-muted truncate flex items-center gap-1.5"><Mail className="w-3 h-3" /> {member.email}</p>
                    <p className={`text-[11px] font-medium mt-1 flex items-center gap-1.5 ${online ? "text-emerald-500" : "text-muted"}`}>
                      {online && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {formatLastSeen(member.lastSeenAt)}
                    </p>
                  </div>
                </div>

                <div className="flex-1">
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-foreground/[0.04] text-muted border border-border">
                          +{skills.length - 4} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-muted italic">No skills added yet</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setSelected(member)} className="flex-1 py-2 rounded-lg bg-foreground/[0.04] text-[12.5px] font-semibold text-foreground hover:bg-foreground/[0.08] transition">
                    View Profile
                  </button>
                  <Link href="/dashboard/chat" className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition">
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ===================== PROFILE DETAILS MODAL ===================== */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => setSelected(null)}>
            <motion.div
              initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="p-6 relative">
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-foreground/[0.06] transition text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl font-bold text-white overflow-hidden ring-4 ring-background shadow-lg mb-4">
                    {selected.image ? <img src={selected.image} alt="" className="w-full h-full object-cover" /> : getInitials(selected.name, selected.email)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center mb-1">
                    <h2 className="text-xl font-bold text-foreground">{selected.name || "Unnamed"}</h2>
                    <RoleBadge role={selected.role} />
                  </div>
                  <p className="text-[13px] text-muted flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selected.email}</p>
                  <p className={`text-[12px] font-semibold mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full ${isOnline(selected.lastSeenAt) ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-foreground/[0.04] text-muted border border-border"}`}>
                    {isOnline(selected.lastSeenAt) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    {formatLastSeen(selected.lastSeenAt)}
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> Skills
                  </h3>
                  {parseSkills(selected.skills).length === 0 ? (
                    <p className="text-[13px] text-muted italic">No skills added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {parseSkills(selected.skills).map((skill) => (
                        <span key={skill} className="text-[12px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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

      {/* ===================== FILTER MODAL ===================== */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => setShowFilters(false)}>
            <motion.div
              initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-sm rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <h3 className="font-semibold text-[14px] flex items-center gap-2"><Filter className="w-4 h-4 text-emerald-500" /> Filter by skill</h3>
                <button onClick={() => setShowFilters(false)} className="p-1 rounded-lg hover:bg-foreground/[0.06] transition"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {allSkills.length === 0 ? (
                  <p className="text-[13px] text-muted text-center py-8">No skills in your workspace yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setSkillFilter(null); setShowFilters(false); }} className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition ${!skillFilter ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "border-border bg-card hover:bg-foreground/[0.04] text-foreground"}`}>
                      All Members
                    </button>
                    {allSkills.map((skill) => (
                      <button key={skill} onClick={() => { setSkillFilter(skill); setShowFilters(false); }} className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition ${skillFilter === skill ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "border-border bg-card hover:bg-foreground/[0.04] text-foreground"}`}>
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

      {/* ===================== INVITE MODAL ===================== */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={closeInvite}>
            <motion.div
              initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-sm rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-[14px] flex items-center gap-2"><UserPlus className="w-4 h-4 text-emerald-500" /> Invite to Workspace</h3>
                <button onClick={closeInvite} className="p-1 rounded-lg hover:bg-foreground/[0.06] transition"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-[13px] text-muted text-center leading-relaxed">
                  Share this link with anyone you want in your workspace. They will create an account and join you.
                </p>

                {!inviteLink && !inviteLoading && (
                  <button onClick={generateInvite} className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-[13px] hover:bg-emerald-600 transition shadow-sm flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Generate Invite Link
                  </button>
                )}

                {inviteLoading && (
                  <div className="text-center py-3 text-[13px] text-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </div>
                )}

                {inviteError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 text-[13px] font-medium">{inviteError}</div>
                )}

                {inviteLink && (
                  <>
                    <div className="rounded-xl border border-border bg-foreground/[0.02] p-3">
                      <p className="text-[10px] font-bold text-muted mb-1.5 uppercase tracking-wider">Invite Link — Expires in 7 days</p>
                      <p className="text-[12px] text-foreground/80 break-all font-mono bg-foreground/[0.04] p-2 rounded-md">{inviteLink}</p>
                    </div>
                    <button onClick={copyInviteLink} className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-[13px] hover:bg-emerald-600 transition shadow-sm flex items-center justify-center gap-2">
                      {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                    </button>
                  </>
                )}

                <p className="text-[11px] font-medium text-muted text-center flex items-center justify-center gap-1.5">
                  <Zap className="w-3 h-3 text-emerald-500" /> Beta: no per-seat limits
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
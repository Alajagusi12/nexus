"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Settings, Users, Trash2, Crown, Shield, Loader2,
  X, Check, AlertTriangle, LogOut, MoreVertical, UserMinus,
  ArrowRightLeft, Search, UserPlus, Mail, Link as LinkIcon, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  role: string;
  memberCount: number;
  isCurrent: boolean;
};

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  joinedAt: string;
  lastSeenAt: string | null;
};

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [myRole, setMyRole] = useState<string>("MEMBER");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [memberMenu, setMemberMenu] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<Member | null>(null);
  const [transferring, setTransferring] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const wsRes = await fetch("/api/workspaces", { cache: "no-store" });
        const wsData = await wsRes.json();
        const current = wsData.workspaces?.find((w: Workspace) => w.id === wsData.currentId);
        if (!current) { setLoading(false); return; }
        
        setWorkspace(current);
        setMyRole(current.role);
        setName(current.name);

        const memRes = await fetch(`/api/workspaces/${current.id}/members`, { cache: "no-store" });
        const memData = await memRes.json();
        setMembers(Array.isArray(memData) ? memData : []);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !name.trim() || savingName) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Workspace renamed");
      setWorkspace({ ...workspace, name: name.trim() });
    } catch (err) { toast.error("Failed to rename"); } 
    finally { setSavingName(false); }
  }

  async function deleteWorkspace() {
    if (!workspace || deleteConfirm !== workspace.name || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Workspace deleted");
      window.location.href = "/dashboard";
    } catch (err: any) { toast.error(err.message || "Failed to delete"); setDeleting(false); }
  }

  async function updateRole(memberId: string, newRole: string) {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members/${memberId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: updated.role } : m)));
      toast.success("Role updated");
      setMemberMenu(null);
    } catch (err: any) { toast.error(err.message || "Failed to update role"); }
  }

  async function removeMember() {
    if (!workspace || !removeTarget || removing) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members/${removeTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      toast.success("Member removed");
      setRemoveTarget(null); setMemberMenu(null);
    } catch (err: any) { toast.error(err.message || "Failed to remove"); } 
    finally { setRemoving(false); }
  }

  async function transferOwnership() {
    if (!workspace || !transferTarget || transferring) return;
    setTransferring(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/transfer`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newOwnerId: transferTarget.id }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Ownership transferred");
      window.location.reload();
    } catch (err: any) { toast.error(err.message || "Failed to transfer"); setTransferring(false); }
  }

  async function leaveWorkspace() {
    if (!workspace || !session?.user?.id) return;
    if (!confirm(`Leave "${workspace.name}"?`)) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members/${session.user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Left workspace");
      window.location.href = "/dashboard";
    } catch (err: any) { toast.error(err.message || "Failed to leave"); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!workspace) return <div className="p-8 text-center text-muted">No workspace found</div>;

  const isOwner = myRole === "OWNER";
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-background min-h-full">
      
      {/* ===================== WORKSPACE IDENTITY BANNER ===================== */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
        className="mb-8 rounded-3xl border border-border bg-gradient-to-br from-card to-background p-6 md:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Building2 className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Workspace Settings
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
                {workspace.name}
              </h1>
              <p className="text-[13px] text-muted flex items-center gap-3">
                <span className="flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> /w/{workspace.slug}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {members.length} members</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Your Role</span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-[13px] ${
              isOwner ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : 
              isAdmin ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : 
              "bg-foreground/[0.04] text-muted border-border"
            }`}>
              {isOwner ? <Crown className="w-4 h-4" /> : isAdmin ? <Shield className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
              {myRole}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===================== GENERAL SETTINGS ===================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6 shadow-sm">
        <h2 className="text-[15px] font-bold flex items-center gap-2 mb-5 tracking-tight text-foreground">
          <Settings className="w-4 h-4 text-emerald-500" /> General Information
        </h2>

        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 text-muted">Workspace name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin}
              className="w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition disabled:opacity-50"
              placeholder="Workspace name"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[12px] font-medium text-muted">Only Admins and Owners can change the workspace name.</p>
            {isAdmin && name.trim() !== workspace.name && (
              <button type="submit" disabled={savingName} className="rounded-lg bg-emerald-500 px-4 py-2 text-white text-[13px] font-semibold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-2 shadow-sm">
                {savingName ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* ===================== MEMBERS LIST ===================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <div>
            <h2 className="text-[15px] font-bold flex items-center gap-2 tracking-tight text-foreground">
              <Users className="w-4 h-4 text-emerald-500" /> Team Members
            </h2>
            <p className="text-[12px] text-muted mt-0.5">Manage who has access to this workspace.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition shadow-sm">
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search members by name or email..."
            className="w-full rounded-xl border border-border bg-foreground/[0.02] pl-9 pr-4 py-2.5 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
          />
        </div>

        <div className="space-y-1">
          {filteredMembers.map((member) => {
            const isMe = member.id === session?.user?.id;
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.02] transition group border border-transparent hover:border-border/50">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[13px] font-bold overflow-hidden flex-shrink-0 border border-emerald-500/20">
                  {member.image ? <img src={member.image} alt="" className="w-full h-full object-cover" /> : (member.name?.[0] || member.email[0])?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold truncate text-foreground">
                      {member.name || "Unnamed"} {isMe && <span className="text-muted font-normal text-[12px]">(You)</span>}
                    </p>
                    {member.role === "OWNER" && (
                      <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20">
                        <Crown className="w-2.5 h-2.5" /> Owner
                      </span>
                    )}
                    {member.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <Shield className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted truncate mt-0.5 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {member.email}</p>
                </div>

                {isAdmin && member.role !== "OWNER" && !isMe && (
                  <div className="relative">
                    <button onClick={() => setMemberMenu(memberMenu === member.id ? null : member.id)} className="p-1.5 rounded-lg hover:bg-foreground/[0.06] transition opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4 text-muted" />
                    </button>
                    <AnimatePresence>
                      {memberMenu === member.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMemberMenu(null)} />
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden py-1">
                            {member.role !== "ADMIN" && (
                              <button onClick={() => updateRole(member.id, "ADMIN")} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] hover:bg-foreground/[0.04] transition text-left">
                                <Shield className="w-4 h-4 text-purple-500" /> Make admin
                              </button>
                            )}
                            {member.role === "ADMIN" && isOwner && (
                              <button onClick={() => updateRole(member.id, "MEMBER")} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] hover:bg-foreground/[0.04] transition text-left">
                                <UserMinus className="w-4 h-4 text-muted" /> Remove admin
                              </button>
                            )}
                            {isOwner && (
                              <button onClick={() => { setTransferTarget(member); setMemberMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] hover:bg-foreground/[0.04] transition text-left">
                                <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Transfer ownership
                              </button>
                            )}
                            <div className="my-1 border-t border-border" />
                            <button onClick={() => { setRemoveTarget(member); setMemberMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] hover:bg-red-500/10 transition text-left text-red-500 font-medium">
                              <UserMinus className="w-4 h-4" /> Remove from workspace
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-[13px] text-muted">No members found matching "{searchQuery}"</div>
          )}
        </div>
      </motion.div>

      {/* ===================== DANGER ZONE ===================== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-5 md:p-6 shadow-sm">
        <h2 className="text-[15px] font-bold flex items-center gap-2 mb-2 text-red-500 tracking-tight">
          <ShieldAlert className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-[13px] text-muted mb-5 max-w-2xl leading-relaxed">
          {isOwner
            ? "Deleting a workspace permanently removes all its chats, tasks, documents, and members. This cannot be undone."
            : "You can leave this workspace at any time. You will immediately lose access to all its content."}
        </p>

        {isOwner ? (
          <button onClick={() => setShowDelete(true)} className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2.5 text-[13px] font-bold hover:bg-red-500/20 transition flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete workspace
          </button>
        ) : (
          <button onClick={leaveWorkspace} className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2.5 text-[13px] font-bold hover:bg-red-500/20 transition flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Leave workspace
          </button>
        )}
      </motion.div>

      {/* ===================== MODALS ===================== */}
      <AnimatePresence>
        {showDelete && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => !deleting && setShowDelete(false)}>
            <motion.div initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl">
              <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Delete workspace?</h3>
                <p className="text-[13px] text-muted text-center mb-5 leading-relaxed">
                  This will permanently delete everything in <strong>{workspace.name}</strong>. This action cannot be undone.
                </p>
                <div className="mb-5">
                  <label className="block text-[12px] font-medium mb-2 text-foreground/70">
                    Type <span className="text-foreground font-mono font-bold">{workspace.name}</span> to confirm
                  </label>
                  <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="w-full rounded-xl border border-border bg-foreground/[0.04] px-4 py-2.5 text-foreground text-[14px] focus:outline-none focus:ring-2 focus:ring-red-500/50 transition" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-foreground/[0.04] transition text-[13px] font-medium disabled:opacity-50">Cancel</button>
                  <button onClick={deleteWorkspace} disabled={deleteConfirm !== workspace.name || deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition text-[13px] disabled:opacity-50 flex items-center justify-center gap-2">
                    {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : "Delete forever"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {removeTarget && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => !removing && setRemoveTarget(null)}>
            <motion.div initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl">
              <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Remove member?</h3>
                <p className="text-[13px] text-muted text-center mb-6 leading-relaxed">
                  <strong>{removeTarget.name || removeTarget.email}</strong> will immediately lose access to this workspace.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setRemoveTarget(null)} disabled={removing} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-foreground/[0.04] transition text-[13px] font-medium disabled:opacity-50">Cancel</button>
                  <button onClick={removeMember} disabled={removing} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition text-[13px] disabled:opacity-50 flex items-center justify-center gap-2">
                    {removing ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing...</> : "Remove"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transferTarget && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={() => !transferring && setTransferTarget(null)}>
            <motion.div initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full md:max-w-md rounded-t-3xl md:rounded-2xl border border-border bg-card shadow-2xl">
              <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted/40" /></div>
              <div className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Transfer ownership?</h3>
                <p className="text-[13px] text-muted text-center mb-6 leading-relaxed">
                  <strong>{transferTarget.name || transferTarget.email}</strong> will become the new Owner. You will be demoted to an Admin.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setTransferTarget(null)} disabled={transferring} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-foreground/[0.04] transition text-[13px] font-medium disabled:opacity-50">Cancel</button>
                  <button onClick={transferOwnership} disabled={transferring} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition text-[13px] disabled:opacity-50 flex items-center justify-center gap-2">
                    {transferring ? <><Loader2 className="w-4 h-4 animate-spin" /> Transferring...</> : "Transfer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
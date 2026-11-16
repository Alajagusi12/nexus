"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2, Users, Loader2, Check, AlertCircle, ArrowRight, Zap, ShieldCheck
} from "lucide-react";

type InviteData = {
  workspace: { id: string; name: string; memberCount: number; };
  invitedBy: string;
  role: string;
};

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { status } = useSession();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invites/${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInvite(data);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load invite"); setLoading(false); });
  }, [token]);

  async function accept() {
    if (status !== "authenticated") {
      router.push(`/register?next=/invite/${token}`);
      return;
    }

    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept");
        setAccepting(false);
        return;
      }

      await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: data.workspaceId }),
      });

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("Failed to accept invite");
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* Animated Background Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none" 
      />

      {/* Navbar */}
      <nav className="relative z-10 p-6 md:p-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Nexus</span>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          
          <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                <p className="text-[13px] font-medium text-muted mt-4">Loading workspace invite...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-foreground mb-2">Invite unavailable</h1>
                <p className="text-[13px] text-muted mb-6 leading-relaxed">{error}</p>
                <Link href="/dashboard" className="inline-flex items-center justify-center w-full rounded-xl bg-foreground text-background py-2.5 text-[13px] font-semibold hover:opacity-90 transition">
                  Go to dashboard
                </Link>
              </div>
            ) : invite ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                    <Building2 className="w-8 h-8" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-foreground mb-2 tracking-tight">You've been invited</h1>
                <p className="text-[13.5px] text-muted text-center mb-8 leading-relaxed">
                  <span className="text-foreground font-semibold">{invite.invitedBy}</span> invited you to join their workspace.
                </p>

                <div className="rounded-2xl border border-border bg-foreground/[0.02] p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-foreground truncate">{invite.workspace.name}</p>
                      <p className="text-[12px] text-muted flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3.5 h-3.5" /> {invite.workspace.memberCount} {invite.workspace.memberCount === 1 ? "member" : "members"}
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={accept} 
                  disabled={accepting} 
                  className="w-full rounded-xl bg-emerald-500 py-3 text-[14px] font-semibold text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
                  ) : status === "authenticated" ? (
                    <><Check className="w-4 h-4" /> Accept & Join</>
                  ) : (
                    <>Sign up to join <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  You'll join as a <span className="text-foreground font-bold uppercase tracking-wider">{invite.role}</span>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-8 text-[12px] text-muted">
        © {new Date().getFullYear()} Nexus. All rights reserved.
      </div>
    </div>
  );
}
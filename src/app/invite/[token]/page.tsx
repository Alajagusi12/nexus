"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

type InviteData = {
  workspace: {
    id: string;
    name: string;
    memberCount: number;
  };
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
        if (data.error) {
          setError(data.error);
        } else {
          setInvite(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load invite");
        setLoading(false);
      });
  }, [token]);

  async function accept() {
    if (status !== "authenticated") {
      // Send to register with redirect back to invite
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

      // Switch to the joined workspace and go to dashboard
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
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-8"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to home
        </Link>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm text-slate-400 mt-4">
                Loading invite...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold mb-2 text-white">
                Invite unavailable
              </h1>
              <p className="text-sm text-slate-400 mb-6">{error}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
              >
                Go to dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : invite ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-5">
                <Building2 className="w-7 h-7 text-white" />
              </div>

              <h1 className="text-xl font-semibold mb-2 text-center text-white">
                You&apos;ve been invited
              </h1>
              <p className="text-sm text-slate-400 text-center mb-6">
                <span className="text-white font-medium">
                  {invite.invitedBy}
                </span>{" "}
                invited you to join
              </p>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {invite.workspace.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {invite.workspace.memberCount}{" "}
                      {invite.workspace.memberCount === 1
                        ? "member"
                        : "members"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={accept}
                disabled={accepting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : status === "authenticated" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Accept & join
                  </>
                ) : (
                  <>
                    Sign up to join
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4">
                You&apos;ll join as{" "}
                <span className="text-slate-400 font-medium">
                  {invite.role.toLowerCase()}
                </span>
              </p>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
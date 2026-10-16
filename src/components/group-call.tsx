"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, AlertCircle, X } from "lucide-react";

type Props = {
  conversationId: string;
  conversationName: string;
  onClose: () => void;
};

export function GroupCall({
  conversationId,
  conversationName,
  onClose,
}: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to join call");
          setLoading(false);
          return;
        }

        setToken(data.token);
        setServerUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL || null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to join call");
        setLoading(false);
      }
    }
    fetchToken();
  }, [conversationId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Joining call...</p>
        </div>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0F1E] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Couldn&apos;t join call
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {error || "LiveKit is not configured"}
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition"
          >
            Back to chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0F1E] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <h2 className="text-sm md:text-base font-semibold text-white truncate">
            {conversationName}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white flex-shrink-0"
          title="Leave call"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* LiveKit conference UI */}
      <div className="flex-1 min-h-0" data-lk-theme="default">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          video={true}
          audio={true}
          onDisconnected={onClose}
          style={{ height: "100%" }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
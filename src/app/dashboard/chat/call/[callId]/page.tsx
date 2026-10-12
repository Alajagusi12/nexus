"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
} from "lucide-react";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: process.env.NEXT_PUBLIC_TURN_URL || "turn:openrelay.metered.ca:80",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || "openrelayproject",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "openrelayproject",
    },
  ],
};

export default function CallPage() {
  const params = useParams();
  const callId = params.callId as string;
  const { data: session } = useSession();
  const router = useRouter();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<
    "connecting" | "waiting" | "active" | "ended"
  >("connecting");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callInfo, setCallInfo] = useState<any>(null);

  useEffect(() => {
    if (callId) init();
  }, [callId]);

  async function init() {
    try {
      const res = await fetch("/api/calls");
      const active = await res.json();
      setCallInfo(active);
    } catch (err) {
      console.error(err);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please allow camera and microphone access");
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("active");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const channel = supabase.channel(`call-${callId}`);
        channel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate, from: session?.user?.id },
        });
      }
    };

    subscribeToSignals();
  }

  function subscribeToSignals() {
    const channel = supabase.channel(`call-${callId}`);

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(payload.offer)
        );
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        channel.send({
          type: "broadcast",
          event: "answer",
          payload: { answer, from: session?.user?.id },
        });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (!pcRef.current) return;
        if (pcRef.current.signalingState === "have-local-offer") {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.answer)
          );
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (!pcRef.current) return;
        if (payload.from === session?.user?.id) return;
        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(payload.candidate)
          );
        } catch (err) {
          console.error("ICE error:", err);
        }
      })
      .on("broadcast", { event: "end-call" }, () => {
        setStatus("ended");
        cleanup();
        setTimeout(() => router.push("/dashboard/chat"), 1500);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && callInfo?.callerId === session?.user?.id) {
          const offer = await pcRef.current!.createOffer();
          await pcRef.current!.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { offer, from: session?.user?.id },
          });
          setStatus("waiting");
        }
      });
  }

  function toggleMute() {
    const newMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !newMuted;
    });
    setMuted(newMuted);
  }

  function toggleCamera() {
    const newOff = !cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !newOff;
    });
    setCameraOff(newOff);
  }

  async function endCall() {
    const channel = supabase.channel(`call-${callId}`);
    channel.send({ type: "broadcast", event: "end-call", payload: {} });
    await fetch("/api/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId, status: "ended" }),
    });
    cleanup();
    router.push("/dashboard/chat");
  }

  function cleanup() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    supabase.removeAllChannels();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h1 className="font-semibold">
            {status === "connecting" && "Connecting..."}
            {status === "waiting" && "Waiting for other person..."}
            {status === "active" && "In call"}
            {status === "ended" && "Call ended"}
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Call ID: {callId?.slice(0, 8)}
        </p>
      </header>

      <div className="flex-1 relative bg-black">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {status !== "active" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-slate-300">
                {status === "connecting" && "Setting up camera..."}
                {status === "waiting" && "Waiting for other person to join..."}
                {status === "ended" && "Call ended"}
              </p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-6 right-6 w-48 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      <div className="border-t border-white/10 p-6 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
            muted
              ? "bg-red-500 hover:bg-red-600"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
            cameraOff
              ? "bg-red-500 hover:bg-red-600"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {cameraOff ? (
            <VideoOff className="w-6 h-6" />
          ) : (
            <Video className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
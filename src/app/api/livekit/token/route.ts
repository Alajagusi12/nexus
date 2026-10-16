import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 }
      );
    }

    // Verify user is a member of this conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 500 }
      );
    }

    // Room name is derived from conversation ID
    const roomName = `conversation-${conversationId}`;

    // Generate token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: session.user.name || session.user.email || "User",
      ttl: "2h",
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      roomName,
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
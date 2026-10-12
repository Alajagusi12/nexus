import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, callType = "video" } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 }
      );
    }

    // Verify the user is a member of the conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get the other member (for 1-on-1 calls)
    const otherMember = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: { not: session.user.id },
      },
    });

    if (!otherMember) {
      return NextResponse.json(
        { error: "No receiver found" },
        { status: 400 }
      );
    }

    const call = await prisma.call.create({
      data: {
        conversationId,
        callerId: session.user.id,
        receiverId: otherMember.userId,
        callType,
        status: "ringing",
      },
    });

    return NextResponse.json(call, { status: 201 });
  } catch (err) {
    console.error("Create call error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId, status } = await req.json();

    if (!callId || !status) {
      return NextResponse.json(
        { error: "callId and status required" },
        { status: 400 }
      );
    }

    const call = await prisma.call.update({
      where: { id: callId },
      data: { status },
    });

    return NextResponse.json(call);
  } catch (err) {
    console.error("Update call error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeCall = await prisma.call.findFirst({
      where: {
        receiverId: session.user.id,
        status: "ringing",
      },
      orderBy: { createdAt: "desc" },
      include: {
        caller: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(activeCall || null);
  } catch (err) {
    console.error("Get call error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}   
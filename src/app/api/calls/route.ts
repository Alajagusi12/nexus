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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const receiverId =
      conversation.user1Id === session.user.id
        ? conversation.user2Id
        : conversation.user1Id;

    const call = await prisma.call.create({
      data: {
        conversationId,
        callerId: session.user.id,
        receiverId,
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

    const call = await prisma.call.update({
      where: { id: callId },
      data: { status },
    });

    return NextResponse.json(call);
  } catch (err) {
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
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
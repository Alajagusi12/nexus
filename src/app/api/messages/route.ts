import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) return null;
  if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
    return null;
  }
  return conversation;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await checkAccess(id, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        userId: { not: session.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("GET messages error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await checkAccess(id, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { content, fileUrl, fileType } = await req.json();

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content?.trim() || "",
        conversationId: id,
        userId: session.user.id,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const receiverId =
      conversation.user1Id === session.user.id
        ? conversation.user2Id
        : conversation.user1Id;

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "message",
        title: `New message from ${session.user.name || "Someone"}`,
        body: content?.trim()?.slice(0, 100) || "Sent an attachment",
        link: "/dashboard/chat",
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("POST message error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await checkAccess(id, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { messageId, emoji } = await req.json();

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const reactions = message.reactions ? JSON.parse(message.reactions) : {};

    const userId = session.user.id;

    if (reactions[emoji]?.includes(userId)) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      if (!reactions[emoji]) reactions[emoji] = [];
      reactions[emoji].push(userId);
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH reaction error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
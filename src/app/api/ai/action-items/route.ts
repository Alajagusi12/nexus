import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractActionItems } from "@/lib/ai";

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

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (messages.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const ordered = messages.reverse().map((m) => ({
      userName: m.user?.name || m.user?.email || "Unknown",
      content: m.content || "(attachment)",
      createdAt: m.createdAt.toISOString(),
    }));

    const items = await extractActionItems(ordered);

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("Action items error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to extract action items" },
      { status: 500 }
    );
  }
}
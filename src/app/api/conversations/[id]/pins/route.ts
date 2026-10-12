import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
  return !!membership;
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
    const hasAccess = await checkAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pins = await prisma.message.findMany({
      where: { conversationId: id, pinnedAt: { not: null } },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { pinnedAt: "desc" },
    });

    return NextResponse.json(pins);
  } catch (err) {
    console.error("GET pins error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
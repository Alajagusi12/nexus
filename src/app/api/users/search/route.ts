import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentWorkspace } from "@/lib/workspace";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    if (q.length < 1) return NextResponse.json({ users: [], tasks: [], conversations: [] });

    const workspace = await getCurrentWorkspace(session.user.id);

    const [users, tasks, conversations] = await Promise.all([
      // 1. Search Users
      prisma.user.findMany({
        where: {
          AND: [
            { id: { not: session.user.id } },
            { OR: [{ email: { contains: q } }, { name: { contains: q } }] },
          ],
        },
        select: { id: true, name: true, email: true, image: true },
        take: 5,
      }),
      // 2. Search Tasks
      prisma.task.findMany({
        where: { workspaceId: workspace.id, title: { contains: q } },
        select: { id: true, title: true, status: true },
        take: 5,
      }),
      // 3. Search Conversations
      prisma.conversation.findMany({
        where: {
          workspaceId: workspace.id,
          members: { some: { userId: session.user.id } },
          name: { contains: q },
        },
        select: { id: true, name: true, isGroup: true },
        take: 5,
      }),
    ]);

    return NextResponse.json({ users, tasks, conversations });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentWorkspace } from "@/lib/workspace";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getCurrentWorkspace(session.user.id);

    const tasks = await prisma.task.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET tasks error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, priority, dueDate, assigneeId } =
      await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const workspace = await getCurrentWorkspace(session.user.id);

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId: workspace.id,
        creatorId: session.user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST task error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
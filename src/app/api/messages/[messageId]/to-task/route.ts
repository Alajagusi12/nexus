import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { title, description, priority, dueDate, assigneeId } =
      await req.json();

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Verify the user is a member of the conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find or create a default workspace
    let workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Default Workspace",
          slug: "default",
        },
      });
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: title?.trim() || "Task from message",
        description: description?.trim() || message.content || null,
        priority: priority || "MEDIUM",
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId: workspace.id,
        creatorId: session.user.id,
        assigneeId: assigneeId || null,
        sourceMessageId: message.id,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("Message to task error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
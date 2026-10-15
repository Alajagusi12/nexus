import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/workspace";

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

    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Must be a member of this workspace
    const role = await getRole(session.user.id, existing.workspaceId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Guests can only change status (e.g. mark as done), not edit content
    if (role === "GUEST") {
      const body = await req.json();
      const onlyStatus =
        body.status !== undefined &&
        body.title === undefined &&
        body.description === undefined &&
        body.priority === undefined &&
        body.dueDate === undefined &&
        body.assigneeId === undefined &&
        body.order === undefined;

      if (!onlyStatus) {
        return NextResponse.json(
          { error: "Guests can only change task status" },
          { status: 403 }
        );
      }

      const task = await prisma.task.update({
        where: { id },
        data: { status: body.status },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json(task);
    }

    // Member/Admin/Owner — normal update
    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.order !== undefined) data.order = body.order;
    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(task);
  } catch (err) {
    console.error("PATCH task error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only creator, admin, or owner can delete
    const role = await getRole(session.user.id, existing.workspaceId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isCreator = existing.creatorId === session.user.id;
    const isPrivileged = role === "OWNER" || role === "ADMIN";

    if (!isCreator && !isPrivileged) {
      return NextResponse.json(
        { error: "Only the creator or an admin can delete this task" },
        { status: 403 }
      );
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE task error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
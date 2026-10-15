import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/workspace";

// PATCH — change member role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, memberId } = await params;
    const { role: newRole } = await req.json();

    if (!newRole || !["ADMIN", "MEMBER", "GUEST"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const myRole = await getRole(session.user.id, workspaceId);
    if (myRole !== "OWNER" && myRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const target = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: memberId, workspaceId },
      },
    });

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't change owner's role
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: "Can't change the owner's role" },
        { status: 400 }
      );
    }

    // Admins can't promote to admin (only owners can)
    if (myRole === "ADMIN" && newRole === "ADMIN") {
      return NextResponse.json(
        { error: "Only owners can promote to admin" },
        { status: 403 }
      );
    }

    // Admins can't demote other admins
    if (myRole === "ADMIN" && target.role === "ADMIN") {
      return NextResponse.json(
        { error: "Only owners can manage admins" },
        { status: 403 }
      );
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: target.id },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            skills: true,
            lastSeenAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updated.user.id,
      name: updated.user.name,
      email: updated.user.email,
      image: updated.user.image,
      skills: updated.user.skills,
      lastSeenAt: updated.user.lastSeenAt,
      role: updated.role,
      joinedAt: updated.joinedAt,
    });
  } catch (err) {
    console.error("Update member role error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE — remove member from workspace
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, memberId } = await params;

    const myRole = await getRole(session.user.id, workspaceId);

    // Allow leaving your own workspace OR admins/owners removing others
    const isSelf = session.user.id === memberId;
    const isPrivileged = myRole === "OWNER" || myRole === "ADMIN";

    if (!isSelf && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!myRole) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const target = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: memberId, workspaceId },
      },
    });

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't remove the owner
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: "The owner can't be removed" },
        { status: 400 }
      );
    }

    // Admins can't remove other admins
    if (myRole === "ADMIN" && target.role === "ADMIN" && !isSelf) {
      return NextResponse.json(
        { error: "Only owners can remove admins" },
        { status: 403 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: target.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Remove member error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
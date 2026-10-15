import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch invite details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { members: true } },
          },
        },
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Invite already used" },
        { status: 410 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    return NextResponse.json({
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
        memberCount: invite.workspace._count.members,
      },
      invitedBy: invite.createdBy.name || invite.createdBy.email,
      role: invite.role,
    });
  } catch (err) {
    console.error("Get invite error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — accept the invite
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Invite already used" },
        { status: 410 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Already a member? Mark used and return success
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (existing) {
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json({
        ok: true,
        workspaceId: invite.workspaceId,
        alreadyMember: true,
      });
    }

    // Add member
    await prisma.workspaceMember.create({
      data: {
        userId: session.user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });

    // Mark invite used
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      workspaceId: invite.workspaceId,
      alreadyMember: false,
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
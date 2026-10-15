import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/workspace";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const { newOwnerId } = await req.json();

    if (!newOwnerId) {
      return NextResponse.json(
        { error: "newOwnerId required" },
        { status: 400 }
      );
    }

    const myRole = await getRole(session.user.id, workspaceId);
    if (myRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only the owner can transfer ownership" },
        { status: 403 }
      );
    }

    // Verify new owner is a member
    const target = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: newOwnerId, workspaceId },
      },
    });

    if (!target) {
      return NextResponse.json(
        { error: "New owner must be a member" },
        { status: 400 }
      );
    }

    // Swap roles
    await prisma.$transaction([
      prisma.workspaceMember.update({
        where: { id: target.id },
        data: { role: "OWNER" },
      }),
      prisma.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId: session.user.id,
            workspaceId,
          },
        },
        data: { role: "ADMIN" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Transfer ownership error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
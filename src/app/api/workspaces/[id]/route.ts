import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/workspace";

// PATCH — rename workspace
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
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const role = await getRole(session.user.id, id);
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can rename" },
        { status: 403 }
      );
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(workspace);
  } catch (err) {
    console.error("Rename workspace error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE — delete workspace (owner only)
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

    const role = await getRole(session.user.id, id);
    if (role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the owner can delete this workspace" },
        { status: 403 }
      );
    }

    // Check if it's their only workspace
    const count = await prisma.workspaceMember.count({
      where: { userId: session.user.id },
    });

    if (count <= 1) {
      return NextResponse.json(
        { error: "You can't delete your only workspace" },
        { status: 400 }
      );
    }

    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete workspace error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/workspace";
import crypto from "crypto";

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
    const { email, role = "MEMBER" } = await req.json().catch(() => ({}));

    // Only admins/owners can invite
    const hasPermission = await isAdmin(session.user.id, workspaceId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only owners and admins can invite" },
        { status: 403 }
      );
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.workspaceInvite.create({
      data: {
        token,
        workspaceId,
        createdById: session.user.id,
        email: email?.trim() || null,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
        expiresAt,
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (err) {
    console.error("Create invite error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
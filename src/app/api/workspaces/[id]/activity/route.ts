import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/workspace";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    const role = await getRole(session.user.id, workspaceId);
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can view activity" },
        { status: 403 }
      );
    }

    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("GET activity error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
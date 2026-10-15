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

    // Verify user is a member
    const role = await getRole(session.user.id, workspaceId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { workspaceId },
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
      orderBy: [
        { role: "asc" }, // OWNER, ADMIN, MEMBER, GUEST
        { joinedAt: "asc" },
      ],
    });

    const members = memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      skills: m.user.skills,
      lastSeenAt: m.user.lastSeenAt,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(members);
  } catch (err) {
    console.error("GET workspace members error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
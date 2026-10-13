import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentWorkspace } from "@/lib/workspace";

// GET — list all workspaces the user belongs to + which one is current
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // Ensure they have at least one workspace
    const currentWorkspace = await getCurrentWorkspace(userId);

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      image: m.workspace.image,
      role: m.role,
      memberCount: m.workspace._count.members,
      isCurrent: m.workspace.id === currentWorkspace.id,
    }));

    return NextResponse.json({ workspaces, currentId: currentWorkspace.id });
  } catch (err) {
    console.error("GET workspaces error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — create a new workspace
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);

    const slug = `${baseSlug || "workspace"}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      image: workspace.image,
      role: "OWNER",
      memberCount: workspace._count.members,
      isCurrent: false,
    });
  } catch (err) {
    console.error("POST workspace error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
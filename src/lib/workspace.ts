import { prisma } from "./prisma";

// Get the current workspace for a user.
// For now: returns their first workspace.
// Later: read from cookie/session for multi-workspace support.
export async function getCurrentWorkspace(userId: string) {
  // Find their membership
  let membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  // If they have no workspace yet, create a personal one
  if (!membership) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const displayName = user?.name || user?.email?.split("@")[0] || "User";
    const baseName = `${displayName}'s Workspace`;
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: baseName,
        slug,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: workspace.id },
      },
      include: { workspace: true },
    });
  }

  return membership!.workspace;
}

// Check if a user is a member of a workspace
export async function isMember(userId: string, workspaceId: string) {
  const m = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return !!m;
}

// Check if a user has admin or owner role
export async function isAdmin(userId: string, workspaceId: string) {
  const m = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return m?.role === "OWNER" || m?.role === "ADMIN";
}
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "nexus_workspace_id";

// Get the current workspace for a user.
// Priority: cookie → first membership → create personal workspace
export async function getCurrentWorkspace(userId: string) {
  // Try cookie first
  let cookieWorkspaceId: string | null = null;
  try {
    const cookieStore = await cookies();
    cookieWorkspaceId = cookieStore.get(COOKIE_NAME)?.value || null;
  } catch {
    // cookies() only works in server components / route handlers
  }

  // If we have a cookie, verify the user is actually a member
  if (cookieWorkspaceId) {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: cookieWorkspaceId },
      },
      include: { workspace: true },
    });
    if (membership) return membership.workspace;
  }

  // Fall back to first membership
  let membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  // If they have no workspace, create a personal one
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

// Get all workspaces the user belongs to
export async function getAllWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    image: m.workspace.image,
    role: m.role,
    memberCount: m.workspace._count.members,
  }));
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

// Export cookie name for use elsewhere
export const WORKSPACE_COOKIE_NAME = COOKIE_NAME;
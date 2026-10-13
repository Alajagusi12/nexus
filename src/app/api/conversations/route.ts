import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentWorkspace } from "@/lib/workspace";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the user's current workspace
    const workspace = await getCurrentWorkspace(userId);

    // Find conversations this user is a member of, in this workspace
    const memberships = await prisma.conversationMember.findMany({
      where: {
        userId,
        conversation: { workspaceId: workspace.id },
      },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    lastSeenAt: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const conversations = memberships.map(({ conversation }) => {
      const otherMembers = conversation.members.filter(
        (m) => m.userId !== userId
      );
      const otherUser = otherMembers[0]?.user || null;
      const lastMessage = conversation.messages[0];

      return {
        id: conversation.id,
        isGroup: conversation.isGroup,
        name: conversation.name,
        displayName: conversation.isGroup
          ? conversation.name || "Group"
          : otherUser?.name || otherUser?.email || "Unknown",
        displayImage: conversation.isGroup ? null : otherUser?.image || null,
        memberCount: conversation.members.length,
        otherUser,
        members: conversation.members.map((m) => m.user),
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              userName: lastMessage.user?.name || null,
            }
          : null,
        updatedAt: conversation.updatedAt,
      };
    });

    // Sort by last message or updated time, newest first
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json(conversations);
  } catch (err) {
    console.error("=== GET CONVERSATIONS ERROR ===");
    console.error("Message:", (err as any)?.message);
    console.error("Code:", (err as any)?.code);
    console.error("Full:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { otherUserIds, name } = await req.json();

    if (!Array.isArray(otherUserIds) || otherUserIds.length === 0) {
      return NextResponse.json(
        { error: "otherUserIds required" },
        { status: 400 }
      );
    }

    const workspace = await getCurrentWorkspace(userId);
    const isGroup = otherUserIds.length > 1;

    // Check if a 1-on-1 conversation already exists between these users in this workspace
    if (!isGroup) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          workspaceId: workspace.id,
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: otherUserIds[0] } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  lastSeenAt: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    // Create the conversation
    const allUserIds = [userId, ...otherUserIds];

    const conversation = await prisma.conversation.create({
      data: {
        name: isGroup ? name || "New group" : null,
        isGroup,
        workspaceId: workspace.id,
        members: {
          create: allUserIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    console.error("=== POST CONVERSATION ERROR ===");
    console.error("Message:", (err as any)?.message);
    console.error("Code:", (err as any)?.code);
    console.error("Full:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
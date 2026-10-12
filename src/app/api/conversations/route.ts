import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
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
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    const formatted = memberships.map((m) => {
      const c = m.conversation;
      const others = c.members
        .filter((mem) => mem.userId !== userId)
        .map((mem) => mem.user);

      let displayName: string;
      let displayImage: string | null = null;

      if (c.isGroup) {
        displayName = c.name || "Group chat";
      } else {
        const other = others[0];
        displayName = other?.name || other?.email || "Unknown";
        displayImage = other?.image || null;
      }

      const lastMessage = c.messages[0] || null;

      return {
        id: c.id,
        isGroup: c.isGroup,
        name: c.name,
        displayName,
        displayImage,
        memberCount: c.members.length,
        otherUser: !c.isGroup ? others[0] : null,
        members: c.members.map((mem) => mem.user),
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              userName: lastMessage.user.name,
            }
          : null,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("=== GET CONVERSATIONS ERROR ===");
    console.error("Message:", err?.message);
    console.error("Code:", err?.code);
    console.error("Meta:", err?.meta);
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

    const { otherUserIds, name } = await req.json();
    const myId = session.user.id;

    const memberIds: string[] = Array.isArray(otherUserIds)
      ? otherUserIds
      : [otherUserIds];

    if (memberIds.length === 0 || memberIds.includes(myId)) {
      return NextResponse.json({ error: "Invalid users" }, { status: 400 });
    }

    const allMembers = [myId, ...memberIds];
    const isGroup = allMembers.length > 2;

    if (!isGroup) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: myId } } },
            { members: { some: { userId: memberIds[0] } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        isGroup,
        name: isGroup ? name || null : null,
        members: {
          create: allMembers.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err: any) {
    console.error("=== POST CONVERSATION ERROR ===");
    console.error("Message:", err?.message);
    console.error("Code:", err?.code);
    console.error("Meta:", err?.meta);
    console.error("Full:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
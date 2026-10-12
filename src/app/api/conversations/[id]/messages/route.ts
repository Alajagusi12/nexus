import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAccess(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
  return !!membership;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hasAccess = await checkAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id, parentId: null },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        userId: { not: session.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("GET messages error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hasAccess = await checkAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { content, fileUrl, fileType, fileName, parentId } =
      await req.json();

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content?.trim() || "",
        conversationId: id,
        userId: session.user.id,
        parentId: parentId || null,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        fileName: fileName || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { replies: true } },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

   if (!parentId) {
      const members = await prisma.conversationMember.findMany({
        where: { conversationId: id, userId: { not: session.user.id } },
      });

      for (const member of members) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            type: "message",
            title: `New message from ${session.user.name || "Someone"}`,
            body: content?.trim()?.slice(0, 100) || "Sent an attachment",
            link: "/dashboard/chat",
          },
        });
      }

      // Fire off push notifications (fire-and-forget)
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: { in: members.map((m) => m.userId) } },
      });

      if (subs.length > 0) {
        const webpush = (await import("web-push")).default;
        webpush.setVapidDetails(
          "mailto:admin@nexus.app",
          process.env.VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!
        );

        const payload = JSON.stringify({
          title: `New message from ${session.user.name || "Someone"}`,
          body: content?.trim()?.slice(0, 100) || "Sent an attachment",
          url: "/dashboard/chat",
        });

        const stale: string[] = [];
        Promise.all(
          subs.map(async (sub) => {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                payload
              );
            } catch (err: any) {
              if (err?.statusCode === 404 || err?.statusCode === 410) {
                stale.push(sub.endpoint);
              }
            }
          })
        ).then(() => {
          if (stale.length > 0) {
            prisma.pushSubscription
              .deleteMany({ where: { endpoint: { in: stale } } })
              .catch(() => {});
          }
        });
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("POST message error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}

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
    const hasAccess = await checkAccess(id, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { messageId, emoji } = await req.json();

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const reactions = message.reactions ? JSON.parse(message.reactions) : {};
    const userId = session.user.id;

    if (reactions[emoji]?.includes(userId)) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      if (!reactions[emoji]) reactions[emoji] = [];
      reactions[emoji].push(userId);
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH reaction error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
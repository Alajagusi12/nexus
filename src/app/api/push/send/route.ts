import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@nexus.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, title, body, url } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      );
    }

    const members = await prisma.conversationMember.findMany({
      where: {
        conversationId,
        userId: { not: session.user.id },
      },
      select: { userId: true },
    });

    const userIds = members.map((m) => m.userId);
    if (userIds.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });

    const payload = JSON.stringify({
      title: title || "New message",
      body: body || "",
      url: url || "/dashboard/chat",
    });

    let sent = 0;
    const staleEndpoints: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            staleEndpoints.push(sub.endpoint);
          } else {
            console.error("Push send error:", err?.message || err);
          }
        }
      })
    );

    if (staleEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: staleEndpoints } },
      });
    }

    return NextResponse.json({ sent });
  } catch (err) {
    console.error("Send push error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
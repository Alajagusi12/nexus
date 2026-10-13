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
    const workspace = await getCurrentWorkspace(userId);

    // Get conversations in this workspace that user is a member of
    const memberships = await prisma.conversationMember.findMany({
      where: {
        userId,
        conversation: { workspaceId: workspace.id },
      },
      select: { conversationId: true },
    });

    const conversationIds = memberships.map((m) => m.conversationId);

    // Total counts (scoped to workspace)
    const [
      totalMessages,
      totalTasks,
      completedTasks,
      totalDocuments,
      totalConversations,
    ] = await Promise.all([
      prisma.message.count({
        where: { conversationId: { in: conversationIds } },
      }),
      prisma.task.count({ where: { workspaceId: workspace.id } }),
      prisma.task.count({
        where: { workspaceId: workspace.id, status: "DONE" },
      }),
      prisma.document.count({ where: { workspaceId: workspace.id } }),
      prisma.conversation.count({
        where: {
          id: { in: conversationIds },
          workspaceId: workspace.id,
        },
      }),
    ]);

    // Messages over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentMessages = await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const messagesByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      messagesByDay[key] = 0;
    }
    recentMessages.forEach((m) => {
      const key = m.createdAt.toISOString().slice(0, 10);
      if (messagesByDay[key] !== undefined) messagesByDay[key]++;
    });

    const messagesChart = Object.entries(messagesByDay).map(
      ([date, count]) => ({
        date: new Date(date + "T00:00:00Z").toLocaleDateString("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        count,
      })
    );

    // Tasks by status (scoped to workspace)
    const [todo, inProgress, review, done] = await Promise.all([
      prisma.task.count({
        where: { workspaceId: workspace.id, status: "TODO" },
      }),
      prisma.task.count({
        where: { workspaceId: workspace.id, status: "IN_PROGRESS" },
      }),
      prisma.task.count({
        where: { workspaceId: workspace.id, status: "REVIEW" },
      }),
      prisma.task.count({
        where: { workspaceId: workspace.id, status: "DONE" },
      }),
    ]);

    const tasksChart = [
      { name: "To Do", value: todo, color: "#94a3b8" },
      { name: "In Progress", value: inProgress, color: "#3b82f6" },
      { name: "Review", value: review, color: "#eab308" },
      { name: "Done", value: done, color: "#22c55e" },
    ];

    // Most active users (by message count in last 30 days, scoped to workspace convos)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topUsersRaw = await prisma.message.groupBy({
      by: ["userId"],
      where: {
        conversationId: { in: conversationIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });

    const userIds = topUsersRaw.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    const topUsers = topUsersRaw.map((u) => {
      const user = users.find((x) => x.id === u.userId);
      return {
        id: u.userId,
        name: user?.name || "Unknown",
        email: user?.email || "",
        image: user?.image || null,
        count: u._count.userId,
      };
    });

    // Recent activity (last 10 messages, scoped to workspace)
    const recentActivity = await prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      totals: {
        messages: totalMessages,
        tasks: totalTasks,
        completedTasks,
        documents: totalDocuments,
        conversations: totalConversations,
      },
      messagesChart,
      tasksChart,
      topUsers,
      recentActivity: recentActivity.map((m) => ({
        id: m.id,
        content: m.content,
        userName: m.user?.name || "Unknown",
        userImage: m.user?.image || null,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
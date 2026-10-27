import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the user's lastSeenAt to right now
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PING API ERROR:", error);
    return NextResponse.json({ error: "Failed to ping" }, { status: 500 });
  }
}
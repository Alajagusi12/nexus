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

    const workspace = await getCurrentWorkspace(session.user.id);

    const documents = await prisma.document.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(documents);
  } catch (err) {
    console.error("GET documents error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();

    const workspace = await getCurrentWorkspace(session.user.id);

    const document = await prisma.document.create({
      data: {
        title: title?.trim() || "Untitled Document",
        content: "",
        workspaceId: workspace.id,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    console.error("POST document error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
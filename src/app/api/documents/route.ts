import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
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

    let workspace = await prisma.workspace.findFirst();

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "My Workspace",
          slug: "my-workspace-" + Date.now(),
        },
      });
    }

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
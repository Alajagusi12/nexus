import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSkills } from "@/lib/skills";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        theme: true,
        skills: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, bio, image, theme, skills } = await req.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(image !== undefined && { image }),
        ...(theme !== undefined && { theme }),
        ...(skills !== undefined && {
          skills: Array.isArray(skills) ? serializeSkills(skills) : null,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        theme: true,
        skills: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
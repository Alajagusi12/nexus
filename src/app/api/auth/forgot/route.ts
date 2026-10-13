import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success, even if user doesn't exist (prevents email enumeration)
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Build the correct base URL — works on Vercel and locally
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || "http://localhost:3000";

    // For local dev, force the known production URL
    const finalBaseUrl = baseUrl.includes("localhost")
      ? "https://nexus-iota-two-17.vercel.app"
      : baseUrl;

    const resetLink = `${finalBaseUrl}/reset-password?token=${token}`;

    console.log("=== PASSWORD RESET LINK ===");
    console.log(`Email: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log("==========================");

    return NextResponse.json({
      ok: true,
      // Remove this in production once email is set up
      resetLink,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
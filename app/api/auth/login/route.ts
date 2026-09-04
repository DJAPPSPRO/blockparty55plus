import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const sql = getSql();
    const rows = await sql`
      SELECT id, email, display_name AS "displayName", avatar_url AS "avatarUrl", role, password_hash AS "passwordHash"
      FROM users WHERE email = ${email} LIMIT 1
    `;
    const user = rows[0];
    if (!user || !verifyPassword(password, String(user.passwordHash))) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    await createSessionCookie(Number(user.id));
    return NextResponse.json({ user: { id: Number(user.id), email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, role: user.role } });
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}

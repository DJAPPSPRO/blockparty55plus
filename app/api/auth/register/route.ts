import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { createSessionCookie, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const displayName = String(body?.displayName ?? "").trim();

    if (!displayName || displayName.length > 80) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const sql = getSql();
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length) return NextResponse.json({ error: "This email is already registered." }, { status: 409 });

    const passwordHash = hashPassword(password);
    const rows = await sql`
      INSERT INTO users (email, display_name, password_hash)
      VALUES (${email}, ${displayName}, ${passwordHash})
      RETURNING id, email, display_name AS "displayName", avatar_url AS "avatarUrl", role
    `;
    const user = rows[0];
    await createSessionCookie(Number(user.id));
    return NextResponse.json({ user });
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getSql } from "@/lib/db";

const schema = z.object({ body: z.string().trim().min(1).max(500) });

export async function POST(request: Request) {
  const sql = getSql();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const input = schema.parse(await request.json());
    const rows = await sql`
      INSERT INTO posts (user_id, author_name, author_avatar_url, body, location)
      VALUES (${user.id}, ${user.displayName}, ${user.avatarUrl}, ${input.body}, 'Your neighborhood')
      RETURNING id
    `;
    return NextResponse.json({ id: Number(rows[0].id) });
  } catch {
    return NextResponse.json({ error: "Could not save post." }, { status: 400 });
  }
}

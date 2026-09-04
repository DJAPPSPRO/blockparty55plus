import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getSql } from "@/lib/db";

const schema = z.object({
  postId: z.number().int().positive(),
  body: z.string().trim().min(1).max(300),
});

export async function POST(request: Request) {
  const sql = getSql();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const input = schema.parse(await request.json());
    const post = await sql`SELECT id FROM posts WHERE id = ${input.postId} LIMIT 1`;
    if (!post.length) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    const rows = await sql`
      INSERT INTO comments (post_id, user_id, author_name, body)
      VALUES (${input.postId}, ${user.id}, ${user.displayName}, ${input.body})
      RETURNING id
    `;
    return NextResponse.json({ id: Number(rows[0].id) });
  } catch {
    return NextResponse.json({ error: "Could not save comment." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const posts = await sql`
    SELECT
      id,
      user_id AS "userId",
      author_name AS "authorName",
      author_avatar_url AS "authorAvatarUrl",
      body,
      location,
      likes_count AS "likesCount",
      created_at AS "createdAt"
    FROM posts
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const comments = await sql`
    SELECT
      id,
      post_id AS "postId",
      author_name AS "authorName",
      body,
      created_at AS "createdAt"
    FROM comments
    ORDER BY created_at ASC
  `;

  const grouped = new Map<number, typeof comments>();
  for (const comment of comments) {
    const postId = Number(comment.postId);
    const list = grouped.get(postId) ?? [];
    list.push(comment);
    grouped.set(postId, list);
  }

  return NextResponse.json({
    posts: posts.map((post) => ({
      ...post,
      id: Number(post.id),
      userId: post.userId == null ? null : Number(post.userId),
      likesCount: Number(post.likesCount),
      createdAt: new Date(post.createdAt).toISOString(),
      comments: (grouped.get(Number(post.id)) ?? []).map((comment) => ({
        ...comment,
        id: Number(comment.id),
        postId: Number(comment.postId),
        createdAt: new Date(comment.createdAt).toISOString(),
      })),
    })),
  });
}

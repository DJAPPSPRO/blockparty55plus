import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getSql } from "@/lib/db";

const schema = z.object({
  invitationId: z.number().int().positive(),
  response: z.enum(["accepted", "maybe", "declined"]),
});

export async function POST(request: Request) {
  const sql = getSql();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const input = schema.parse(await request.json());
    const rows = await sql`
      UPDATE invitations
      SET response = ${input.response}
      WHERE id = ${input.invitationId} AND recipient_user_id = ${user.id}
      RETURNING id
    `;
    if (!rows.length) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save response." }, { status: 400 });
  }
}

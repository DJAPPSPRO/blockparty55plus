import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rows = await sql`
    SELECT
      id,
      host_name AS "hostName",
      title,
      details,
      event_at AS "eventAt",
      location,
      response,
      created_at AS "createdAt"
    FROM invitations
    WHERE recipient_user_id = ${user.id}
    ORDER BY event_at ASC
  `;

  return NextResponse.json({
    invitations: rows.map((invite) => ({
      ...invite,
      id: Number(invite.id),
      eventAt: new Date(invite.eventAt).toISOString(),
      createdAt: new Date(invite.createdAt).toISOString(),
    })),
  });
}

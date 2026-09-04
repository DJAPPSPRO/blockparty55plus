export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import InvitationsClient from "./InvitationsClient";

export default async function InvitationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <InvitationsClient />;
}

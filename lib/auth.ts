import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

const COOKIE_NAME = "bp55_session";

function getSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function makeToken(userId: number) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 30 * 86400000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: number; exp?: number };
  if (!Number.isInteger(parsed.userId) || !parsed.exp || parsed.exp < Date.now()) return null;
  return parsed.userId as number;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSessionCookie(userId: number) {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const userId = readToken(token);
    if (!userId) return null;

    const sql = getSql();
    const rows = await sql`
      SELECT id, email, display_name AS "displayName", avatar_url AS "avatarUrl", role
      FROM users WHERE id = ${userId} LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      email: String(row.email),
      displayName: String(row.displayName),
      avatarUrl: row.avatarUrl ? String(row.avatarUrl) : null,
      role: row.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

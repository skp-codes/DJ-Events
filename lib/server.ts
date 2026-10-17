import { admin as identityAdmin, getUser, refreshSession, type User } from "@netlify/identity";
import { eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";

export type Profile = typeof profiles.$inferSelect;

// The account with this email is the site admin. It is auto-approved and can see and manage every workspace.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "dj.events.mgr.1980@gmail.com").trim().toLowerCase();

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const MIN_PASSWORD = 6;

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

export function normUsername(u: unknown) {
  return String(u ?? "").trim().toLowerCase();
}
export function normEmail(e: unknown) {
  return String(e ?? "").trim().toLowerCase();
}
export function isAdminEmail(email: string | undefined | null) {
  return !!email && email.toLowerCase() === ADMIN_EMAIL;
}

export async function readJson(req: Request): Promise<Record<string, any>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

/** Finds the email for a "username or email" sign-in identifier. */
export async function resolveEmail(identifier: unknown): Promise<string | null> {
  const id = String(identifier ?? "").trim().toLowerCase();
  if (!id) return null;
  if (id.includes("@")) return id;
  const [row] = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.username, id)).limit(1);
  return row?.email ?? null;
}

async function uniqueUsername(base: string) {
  let candidate = (base.replace(/[^a-z0-9._-]/g, "").slice(0, 24) || "user").padEnd(3, "0");
  for (let n = 1; n < 50; n++) {
    const [taken] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, candidate)).limit(1);
    if (!taken) return candidate;
    candidate = `${candidate.replace(/-\d+$/, "")}-${n + 1}`;
  }
  return `user-${Date.now().toString(36)}`;
}

/**
 * Returns the profile for an Identity user, creating it on first sight (covers users added from the
 * Netlify dashboard) and keeping the admin account's role in sync with ADMIN_EMAIL.
 */
export async function ensureProfile(user: User): Promise<Profile> {
  const email = normEmail(user.email);
  const admin = isAdminEmail(email);
  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing) {
    if (admin && (existing.role !== "admin" || existing.status !== "active")) {
      const [updated] = await db
        .update(profiles)
        .set({ role: "admin", status: "active", approvedAt: existing.approvedAt ?? new Date() })
        .where(eq(profiles.id, user.id))
        .returning();
      return updated;
    }
    return existing;
  }
  const meta = (user.userMetadata ?? {}) as Record<string, unknown>;
  const wanted = normUsername(meta.username) || email.split("@")[0];
  const username = await uniqueUsername(wanted);
  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      username,
      email,
      orgName: String(meta.org_name ?? "").trim().slice(0, 60),
      role: admin ? "admin" : "user",
      status: admin ? "active" : "pending",
      approvedAt: admin ? new Date() : null,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [row] = await db.select().from(profiles).where(or(eq(profiles.id, user.id), eq(profiles.email, email))).limit(1);
  return row;
}

/**
 * Mirrors the app role ('admin' | 'user') into Identity's app_metadata.roles so it also shows in the
 * Netlify dashboard's Identity user list. The profiles table stays the source of truth; failures are ignored.
 */
export async function syncIdentityRole(user: Pick<User, "id" | "roles">, role: string) {
  const current = user.roles ?? [];
  if (current.length === 1 && current[0] === role) return;
  try {
    await identityAdmin.updateUser(user.id, { app_metadata: { roles: [role] } });
  } catch (error) {
    console.warn("could not sync identity role", error);
  }
}

export type Session = { user: User; profile: Profile; isAdmin: boolean };

/** Reads the signed-in user from the Identity cookie (refreshing it if near expiry). */
export async function getSession(): Promise<Session | null> {
  try {
    await refreshSession();
  } catch {
    // fall through — getUser() decides
  }
  const user = await getUser();
  if (!user) return null;
  const profile = await ensureProfile(user);
  if (!profile) return null;
  return { user, profile, isAdmin: profile.role === "admin" };
}

export function publicProfile(p: Profile) {
  return {
    id: p.id,
    username: p.username,
    email: p.email,
    orgName: p.orgName,
    role: p.role,
    status: p.status,
    createdAt: p.createdAt,
    approvedAt: p.approvedAt,
    lastSeenAt: p.lastSeenAt,
  };
}

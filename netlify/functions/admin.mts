import type { Config, Context } from "@netlify/functions";
import { AuthError, admin } from "@netlify/identity";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { helpRequests, profiles, workspaces } from "../../db/schema.js";
import { MIN_PASSWORD, fail, getSession, json, publicProfile, readJson } from "../../lib/server.js";

export default async (req: Request, context: Context) => {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  if (!session.isAdmin) return fail("Admins only", 403);

  const { resource, id } = context.params;
  try {
    if (resource === "users") {
      if (!id && req.method === "GET") return await listUsers();
      if (id && req.method === "POST") return await updateUser(id, await readJson(req), session.profile.id);
      if (id && req.method === "DELETE") return await deleteUser(id, session.profile.id);
    }
    if (resource === "requests") {
      if (!id && req.method === "GET") return await listRequests();
      if (id && req.method === "POST") return await updateRequest(Number(id), await readJson(req));
    }
    return fail("Not found", 404);
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message || "Identity request failed", 502);
    console.error(error);
    return fail("Something went wrong", 500);
  }
};

async function listUsers() {
  const rows = await db
    .select({
      profile: profiles,
      updatedAt: workspaces.updatedAt,
      inquiries: sql<number>`coalesce(jsonb_array_length(${workspaces.data}->'inquiries'), 0)`,
      bookings: sql<number>`coalesce(jsonb_array_length(${workspaces.data}->'bookings'), 0)`,
    })
    .from(profiles)
    .leftJoin(workspaces, eq(workspaces.userId, profiles.id))
    .orderBy(desc(profiles.createdAt));
  const [{ open }] = await db
    .select({ open: sql<number>`count(*)::int` })
    .from(helpRequests)
    .where(eq(helpRequests.status, "open"));
  return json({
    users: rows.map((r) => ({
      ...publicProfile(r.profile),
      dataUpdatedAt: r.updatedAt,
      inquiries: Number(r.inquiries) || 0,
      bookings: Number(r.bookings) || 0,
    })),
    openRequests: open,
  });
}

async function updateUser(id: string, body: Record<string, any>, selfId: string) {
  const [target] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!target) return fail("User not found", 404);
  const action = String(body.action ?? "");

  if (action === "approve" || action === "enable") {
    const [p] = await db
      .update(profiles)
      .set({ status: "active", approvedAt: target.approvedAt ?? new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return json({ ok: true, user: publicProfile(p) });
  }
  if (action === "disable") {
    if (id === selfId || target.role === "admin") return fail("The admin account can't be disabled.");
    const [p] = await db.update(profiles).set({ status: "disabled" }).where(eq(profiles.id, id)).returning();
    return json({ ok: true, user: publicProfile(p) });
  }
  if (action === "password") {
    const password = String(body.password ?? "");
    if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`);
    // confirm:true also unlocks accounts that never clicked their confirmation email.
    await admin.updateUser(id, { password, confirm: true });
    return json({ ok: true });
  }
  return fail("Unknown action");
}

async function deleteUser(id: string, selfId: string) {
  if (id === selfId) return fail("You can't delete your own admin account.");
  const [target] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!target) return fail("User not found", 404);
  if (target.role === "admin") return fail("The admin account can't be deleted.");
  try {
    await admin.deleteUser(id);
  } catch (error) {
    // Already gone from Identity — still clean up our records.
    if (!(error instanceof AuthError && error.status === 404)) throw error;
  }
  await db.delete(profiles).where(eq(profiles.id, id)); // workspace cascades
  return json({ ok: true });
}

async function listRequests() {
  const rows = await db.select().from(helpRequests).orderBy(desc(helpRequests.createdAt)).limit(200);
  // Link each request to an account when the username or email matches one.
  const users = await db.select({ id: profiles.id, username: profiles.username, email: profiles.email }).from(profiles);
  return json({
    requests: rows.map((r) => {
      const u = users.find(
        (x) => (r.username && x.username === r.username.toLowerCase()) || (r.email && x.email === r.email.toLowerCase())
      );
      return { ...r, userId: u?.id ?? null, matchedUsername: u?.username ?? null };
    }),
  });
}

async function updateRequest(id: number, body: Record<string, any>) {
  if (!id) return fail("Not found", 404);
  const resolved = body.status !== "open";
  await db
    .update(helpRequests)
    .set({ status: resolved ? "resolved" : "open", resolvedAt: resolved ? new Date() : null })
    .where(eq(helpRequests.id, id));
  return json({ ok: true });
}

export const config: Config = {
  path: ["/api/admin/:resource", "/api/admin/:resource/:id"],
};

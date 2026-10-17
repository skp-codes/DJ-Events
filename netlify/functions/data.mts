import type { Config } from "@netlify/functions";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles, workspaces } from "../../db/schema.js";
import { fail, getSession, json, readJson } from "../../lib/server.js";

// GET/PUT the signed-in user's workspace. Admins may pass ?user=<id> to open anyone's workspace.
export default async (req: Request) => {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  if (!session.isAdmin && session.profile.status !== "active") {
    return fail(session.profile.status === "disabled" ? "Account disabled" : "Awaiting approval", 403);
  }

  const requested = new URL(req.url).searchParams.get("user");
  let userId = session.profile.id;
  if (requested && requested !== userId) {
    if (!session.isAdmin) return fail("Forbidden", 403);
    const [target] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, requested)).limit(1);
    if (!target) return fail("User not found", 404);
    userId = target.id;
  }

  if (req.method === "GET") {
    const [row] = await db.select().from(workspaces).where(eq(workspaces.userId, userId)).limit(1);
    return json({ userId, data: row?.data ?? null, version: row?.version ?? 0, updatedAt: row?.updatedAt ?? null });
  }

  if (req.method === "PUT") {
    const body = await readJson(req);
    const data = body.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return fail("Invalid data");
    const baseVersion = Number(body.version) || 0;

    if (baseVersion === 0) {
      const [inserted] = await db
        .insert(workspaces)
        .values({ userId, data, version: 1 })
        .onConflictDoNothing()
        .returning({ version: workspaces.version, updatedAt: workspaces.updatedAt });
      if (inserted) return json({ ok: true, ...inserted });
    } else {
      const [updated] = await db
        .update(workspaces)
        .set({ data, version: baseVersion + 1, updatedAt: new Date() })
        .where(and(eq(workspaces.userId, userId), eq(workspaces.version, baseVersion)))
        .returning({ version: workspaces.version, updatedAt: workspaces.updatedAt });
      if (updated) return json({ ok: true, ...updated });
    }

    // Someone else (another device, or the admin) saved first — hand back the latest copy.
    const [latest] = await db.select().from(workspaces).where(eq(workspaces.userId, userId)).limit(1);
    return json({ error: "conflict", data: latest?.data ?? null, version: latest?.version ?? 0 }, 409);
  }

  return fail("Method not allowed", 405);
};

export const config: Config = {
  path: "/api/data",
  method: ["GET", "PUT"],
};

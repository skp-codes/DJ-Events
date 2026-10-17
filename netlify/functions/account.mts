import type { Config } from "@netlify/functions";
import { AuthError, admin, login } from "@netlify/identity";
import { MIN_PASSWORD, fail, getSession, json, readJson } from "../../lib/server.js";

// Lets a signed-in user change their own password after confirming the current one.
export default async (req: Request) => {
  const session = await getSession();
  if (!session) return fail("Not signed in", 401);
  const body = await readJson(req);
  const current = String(body.currentPassword ?? "");
  const next = String(body.newPassword ?? "");
  if (next.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`);
  try {
    await login(session.profile.email, current);
  } catch (error) {
    if (error instanceof AuthError) return fail("Current password is incorrect.", 400);
    throw error;
  }
  await admin.updateUser(session.user.id, { password: next });
  return json({ ok: true });
};

export const config: Config = {
  path: "/api/account/password",
  method: "POST",
};

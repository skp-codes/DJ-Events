import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles } from "../../db/schema.js";
import { fail, getSession, json, publicProfile } from "../../lib/server.js";

// Signed-out visitors get 200 with profile: null so the sign-in page loads without an error response.
export default async () => {
  try {
    const session = await getSession();
    if (!session) return json({ profile: null, isAdmin: false });
    await db.update(profiles).set({ lastSeenAt: new Date() }).where(eq(profiles.id, session.profile.id));
    return json({ profile: publicProfile(session.profile), isAdmin: session.isAdmin });
  } catch (error) {
    console.error(error);
    return fail("Something went wrong. Please try again.", 500);
  }
};

export const config: Config = {
  path: "/api/me",
  method: "GET",
};

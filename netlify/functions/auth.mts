import type { Config, Context } from "@netlify/functions";
import { AuthError, MissingIdentityError, login, logout, requestPasswordRecovery, signup, verifyRequestOrigin } from "@netlify/identity";
import { eq, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { helpRequests, profiles } from "../../db/schema.js";
import {
  MIN_PASSWORD,
  USERNAME_RE,
  ensureProfile,
  fail,
  isAdminEmail,
  json,
  normEmail,
  normUsername,
  publicProfile,
  readJson,
  resolveEmail,
  syncIdentityRole,
} from "../../lib/server.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);
  const action = context.params.action;
  try {
    verifyRequestOrigin(req);
  } catch {
    return fail("Request blocked", 403);
  }
  const body = await readJson(req);

  try {
    switch (action) {
      case "signup":
        return await handleSignup(body);
      case "login":
        return await handleLogin(body);
      case "logout":
        await logout().catch(() => {});
        return json({ ok: true });
      case "recover":
        return await handleRecover(body);
      case "help":
        return await handleHelp(body);
      default:
        return fail("Not found", 404);
    }
  } catch (error) {
    if (error instanceof MissingIdentityError) {
      console.error(error);
      return fail("Accounts are not available right now — Netlify Identity is not enabled for this site.", 503);
    }
    if (error instanceof AuthError) {
      console.error(`identity ${action} failed`, error.status, error.message);
      return fail(friendlyAuthError(error), error.status && error.status < 500 ? error.status : 502);
    }
    console.error(error);
    return fail("Something went wrong. Please try again.", 500);
  }
};

/** Turns raw Identity (GoTrue) errors into something a person can act on. */
function friendlyAuthError(error: AuthError) {
  const msg = error.message || "";
  if (error.status === 403 || /signups? not allowed/i.test(msg)) return "New sign-ups are currently closed. Ask the admin for an invite.";
  if (error.status === 401) return "Accounts can't be created while the site is limited to Netlify team members. Turn off Netlify team login under Project configuration > General > Visitor access.";
  if (error.status === 404) return "Accounts are not available right now — Netlify Identity is not enabled for this site.";
  if (error.status === 429 || /rate limit/i.test(msg)) return "Too many attempts. Please wait a few minutes and try again.";
  if (/password/i.test(msg)) return msg;
  if (/email/i.test(msg) && /invalid|validate|format/i.test(msg)) return "Enter a valid email address.";
  if (/confirmation mail|sending/i.test(msg)) return "Your account could not be created because the confirmation email failed to send. Please try again shortly.";
  return msg || "Something went wrong. Please try again.";
}

async function handleSignup(body: Record<string, any>) {
  const username = normUsername(body.username);
  const email = normEmail(body.email);
  const password = String(body.password ?? "");
  const orgName = String(body.orgName ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!orgName) return fail("Enter your organisation name.");
  if (!USERNAME_RE.test(username)) return fail("Username must be 3–30 characters: letters, numbers, dot, dash or underscore.");
  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.");
  if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`);

  const [clash] = await db
    .select({ username: profiles.username, email: profiles.email })
    .from(profiles)
    .where(or(eq(profiles.username, username), eq(profiles.email, email)))
    .limit(1);
  if (clash) {
    return fail(clash.username === username ? "That username is already taken." : "An account with that email already exists. Try signing in or resetting your password.");
  }

  let user;
  try {
    user = await signup(email, password, { username, full_name: username, org_name: orgName });
  } catch (error) {
    if (error instanceof AuthError && /already|registered|exists/i.test(error.message)) {
      return fail("An account with that email already exists. Try signing in or resetting your password.");
    }
    throw error;
  }

  const admin = isAdminEmail(email);
  await db
    .insert(profiles)
    .values({ id: user.id, username, email, orgName, role: admin ? "admin" : "user", status: admin ? "active" : "pending", approvedAt: admin ? new Date() : null })
    .onConflictDoNothing();
  await syncIdentityRole(user, admin ? "admin" : "user");

  return json({
    ok: true,
    // When email confirmation is on (the default), the user must click the link before signing in.
    needsConfirmation: !user.confirmedAt,
    needsApproval: !admin,
  });
}

async function handleLogin(body: Record<string, any>) {
  const password = String(body.password ?? "");
  const email = await resolveEmail(body.identifier);
  if (!email || !password) return fail("Incorrect username or password.", 401);
  try {
    const user = await login(email, password);
    const profile = await ensureProfile(user);
    await syncIdentityRole(user, profile.role);
    return json({ ok: true, profile: publicProfile(profile) });
  } catch (error) {
    if (error instanceof AuthError) {
      if (/confirm/i.test(error.message)) return fail("Please confirm your email first — check your inbox for the confirmation link.", 403);
      return fail("Incorrect username or password.", 401);
    }
    throw error;
  }
}

async function handleRecover(body: Record<string, any>) {
  const email = await resolveEmail(body.identifier);
  if (email) {
    try {
      await requestPasswordRecovery(email);
    } catch (error) {
      console.warn("recovery request failed", error);
    }
  }
  // Same answer either way so the form can't be used to discover accounts.
  return json({ ok: true });
}

async function handleHelp(body: Record<string, any>) {
  const username = String(body.username ?? "").trim().slice(0, 60);
  const email = normEmail(body.email).slice(0, 120);
  const message = String(body.message ?? "").trim().slice(0, 1000);
  const topic = String(body.topic ?? "password").slice(0, 30);
  if (!username && !email) return fail("Enter your username or email so the admin knows who you are.");
  await db.insert(helpRequests).values({ topic, username, email, message });
  return json({ ok: true });
}

export const config: Config = {
  path: "/api/auth/:action",
};

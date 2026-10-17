// Browser half of Netlify Identity. The classic app script (public/app.js) waits for `window.ReyAuth`.
// Handles email links (confirmation / password recovery), keeps the session cookie fresh, and signs out.
import { getUser, handleAuthCallback, hydrateSession, logout, refreshSession, updateUser } from "@netlify/identity";

type CallbackInfo = { type: string } | null;

let callback: CallbackInfo = null;

async function start() {
  try {
    const result = await handleAuthCallback();
    if (result) callback = { type: result.type };
  } catch (error) {
    console.warn("auth callback failed", error);
    callback = { type: "error" };
  }
  try {
    await hydrateSession();
  } catch {
    // not signed in
  }
}

const ready = start();

const ReyAuth = {
  ready: () => ready,
  callback: () => callback,
  clearCallback: () => {
    callback = null;
  },
  /** Sets a new password for the session opened by a recovery email link. */
  setPassword: async (password: string) => {
    await updateUser({ password });
  },
  refresh: async () => {
    try {
      await hydrateSession();
      await refreshSession();
      return !!(await getUser());
    } catch {
      return false;
    }
  },
  signOut: async () => {
    try {
      await logout();
    } catch {
      // cookies are cleared server-side below as a fallback
    }
  },
};

declare global {
  interface Window {
    ReyAuth: typeof ReyAuth;
  }
}

window.ReyAuth = ReyAuth;
window.dispatchEvent(new Event("reyauth-ready"));

/**
 * Lightweight, structured auth telemetry.
 *
 * Goal: emit consistent, greppable logs around the auth lifecycle so we can
 * diagnose race conditions in production (e.g. login requiring two attempts,
 * unexpected redirects between /membros and /dashboard).
 *
 * All events share the prefix "[auth]" and a stable `event` name. We also
 * include a monotonically increasing sequence and a millisecond delta from
 * the previous event so timelines are easy to read.
 *
 * No PII: never log emails, tokens, or full user objects. Only user id
 * (already a UUID) and role names.
 */

type AuthEvent =
  | "session_loading_start"
  | "session_loading_end"
  | "auth_state_change"
  | "profile_loading_start"
  | "profile_loaded"
  | "profile_load_error"
  | "user_data_cleared"
  | "sign_in_attempt"
  | "sign_in_result"
  | "sign_out"
  | "protected_route_check"
  | "protected_route_redirect"
  | "login_redirect_to_dashboard";

interface AuthLogPayload {
  [key: string]: unknown;
}

let seq = 0;
let lastTs = 0;

export function logAuth(event: AuthEvent, payload: AuthLogPayload = {}) {
  const now = performance.now();
  const delta = lastTs === 0 ? 0 : Math.round(now - lastTs);
  lastTs = now;
  seq += 1;

  // Single console.info call so it groups nicely in production log viewers.
  // eslint-disable-next-line no-console
  console.info(
    `[auth] #${seq} +${delta}ms ${event}`,
    {
      ts: new Date().toISOString(),
      route: typeof window !== "undefined" ? window.location.pathname : "ssr",
      ...payload,
    }
  );
}

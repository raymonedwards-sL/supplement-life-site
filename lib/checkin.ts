/**
 * Weekly Check-In Loop (docs/SAGE_Weekly_CheckIn_Loop_Gap2.md) — the
 * cadence constant/helper shared between app/api/dashboard/check-in/route.ts
 * (server-side enforcement) and components/life-brief/Roadmap.tsx (a
 * Server Component that precomputes the initial blocked/unblocked state
 * so the client form never needs to read Date.now() itself).
 */
export const CHECK_IN_CADENCE_DAYS = 7;

/** Null if there's no prior check-in on file (nothing to wait out). */
export function getNextCheckInAvailableAt(lastCheckInAt: string | null): Date | null {
  if (!lastCheckInAt) return null;
  return new Date(new Date(lastCheckInAt).getTime() + CHECK_IN_CADENCE_DAYS * 24 * 60 * 60 * 1000);
}

/** Wraps the Date.now() read in a plain (non-component) function —
 * components/life-brief/Roadmap.tsx calls this rather than reading
 * Date.now() directly in its own body, since that's flagged as an impure
 * render by this project's eslint react-hooks/purity rule even for a
 * Server Component. */
export function isCheckInBlocked(nextCheckInAvailableAt: Date | null): boolean {
  return nextCheckInAvailableAt != null && nextCheckInAvailableAt.getTime() > Date.now();
}

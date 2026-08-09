import { AdminProfile, parseAdminSession } from './admin-session.model';

/**
 * Mirrors SiguientePasoMfa in openapi.yaml. The HTTP client must branch on this exact value —
 * never infer the next step from `mfaEstado`, which is informative/debugging only.
 */
export type MfaSiguientePaso = 'MFA_ENROLLMENT_REQUIRED' | 'MFA_CHALLENGE_REQUIRED';

const MFA_SIGUIENTE_PASOS: readonly MfaSiguientePaso[] = [
  'MFA_ENROLLMENT_REQUIRED',
  'MFA_CHALLENGE_REQUIRED',
];

/** Shape of the new POST /admin/auth/login response (Checkpoint 6B-2 contract). */
export interface AdminLoginPreMfaResponse {
  readonly mensaje: string;
  readonly preMfaToken: string;
  readonly siguientePaso: MfaSiguientePaso;
  readonly mfaEstado: 'NO_ENROLADO' | 'PENDIENTE_CONFIRMACION' | 'ACTIVO';
}

/**
 * Shape of POST /admin/auth/mfa/enroll. `secreto` has no `required:` entry in openapi.yaml, so it
 * is treated as optional here too — the manual-key fallback is only offered when present.
 */
export interface AdminMfaEnrollResponse {
  readonly mensaje: string;
  readonly secreto?: string;
  readonly otpauthUri: string;
}

/**
 * Shape of POST /admin/auth/mfa/enroll/confirm and POST /admin/auth/mfa/verify when MFA
 * completes successfully. `codigosRecuperacion` only appears on the enroll/confirm response
 * (the first-enrollment batch) — never on verify.
 */
export interface AdminMfaSessionResponse {
  readonly mensaje: string;
  readonly token: string;
  readonly admin: AdminProfile;
  readonly codigosRecuperacion?: readonly string[];
}

/**
 * Stricter shape required specifically from POST /admin/auth/mfa/enroll/confirm: unlike a plain
 * session, a first-enrollment confirmation is only usable by the frontend if it also carries a
 * non-empty `codigosRecuperacion` batch — without it there is nothing to show/acknowledge, and
 * the whole "confirm the codes were saved before entering the panel" flow cannot happen. Codes
 * are never invented client-side, so a response missing them is treated as invalid, not degraded.
 */
export interface AdminMfaEnrollConfirmSession {
  readonly token: string;
  readonly admin: AdminProfile;
  readonly codigosRecuperacion: readonly string[];
}

/**
 * Pure, defensive parser for a POST /admin/auth/mfa/enroll/confirm response. Reuses
 * `parseAdminSession` for the token/admin shape, then additionally requires `codigosRecuperacion`
 * to be a non-empty array of non-empty strings. Never throws, never fabricates codes: any
 * violation returns `null`, which callers must treat as "cannot complete enrollment" — no
 * AdminSession, no navigation, no invented codes.
 */
export function parseAdminMfaEnrollConfirmSession(
  raw: unknown,
): AdminMfaEnrollConfirmSession | null {
  const session = parseAdminSession(raw);
  if (!session) {
    return null;
  }

  const codigosRecuperacion = (raw as Record<string, unknown>)['codigosRecuperacion'];
  if (
    !Array.isArray(codigosRecuperacion) ||
    codigosRecuperacion.length === 0 ||
    !codigosRecuperacion.every((codigo) => typeof codigo === 'string' && codigo.trim().length > 0)
  ) {
    return null;
  }

  return {
    token: session.token,
    admin: session.admin,
    codigosRecuperacion: codigosRecuperacion as readonly string[],
  };
}

/** The only two fields ever kept for a pending MFA flow — never a usable session by itself. */
export interface AdminMfaFlow {
  readonly preMfaToken: string;
  readonly siguientePaso: MfaSiguientePaso;
}

/**
 * Pure, defensive parser for whatever was last written to the MFA flow's sessionStorage slot.
 * Never throws: a missing, malformed, or tampered value is treated as "no active flow" rather
 * than crashing the app or trusting an attacker-controlled string.
 */
export function parseAdminMfaFlow(raw: unknown): AdminMfaFlow | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const preMfaToken = source['preMfaToken'];
  const siguientePaso = source['siguientePaso'];

  if (typeof preMfaToken !== 'string' || preMfaToken.trim().length === 0) {
    return null;
  }
  if (
    typeof siguientePaso !== 'string' ||
    !MFA_SIGUIENTE_PASOS.includes(siguientePaso as MfaSiguientePaso)
  ) {
    return null;
  }

  return { preMfaToken, siguientePaso: siguientePaso as MfaSiguientePaso };
}

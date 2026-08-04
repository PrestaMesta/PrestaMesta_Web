/** Matches the `Rol` enum in the Prestamesta API contract. */
export type AdminRole = 'SUPERADMIN' | 'ANALISTA' | 'COBRADOR';

const ADMIN_ROLES: readonly AdminRole[] = ['SUPERADMIN', 'ANALISTA', 'COBRADOR'];

export interface AdminProfile {
  readonly id: number;
  readonly nombre: string;
  readonly email: string;
  readonly rol: AdminRole;
}

/** Shape of a successful POST /admin/auth/login response. */
export interface AdminLoginResponse {
  readonly mensaje: string;
  readonly token: string;
  readonly admin: AdminProfile;
}

export interface AdminSession {
  readonly token: string;
  readonly admin: AdminProfile;
}

/**
 * Pure, defensive parser for whatever was last written to `sessionStorage`. Never throws: a
 * missing, malformed, or tampered value is treated as "no session" rather than crashing the app
 * or silently trusting an attacker-controlled string.
 */
export function parseAdminSession(raw: unknown): AdminSession | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const token = source['token'];
  const admin = source['admin'];

  if (typeof token !== 'string' || token.trim().length === 0) {
    return null;
  }
  if (typeof admin !== 'object' || admin === null) {
    return null;
  }

  const a = admin as Record<string, unknown>;
  if (
    typeof a['id'] !== 'number' ||
    typeof a['nombre'] !== 'string' ||
    typeof a['email'] !== 'string' ||
    typeof a['rol'] !== 'string' ||
    !ADMIN_ROLES.includes(a['rol'] as AdminRole)
  ) {
    return null;
  }

  return {
    token,
    admin: { id: a['id'], nombre: a['nombre'], email: a['email'], rol: a['rol'] as AdminRole },
  };
}

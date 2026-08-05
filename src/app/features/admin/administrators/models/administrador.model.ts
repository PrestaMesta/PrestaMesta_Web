import { AdminRole } from '../../auth/models/admin-session.model';

/**
 * Mirrors CrearAdministradorInput exactly (openapi.yaml / validators/adminAuthValidators.js
 * `crearAdministradorSchema`, `.strict()`). `rol` genuinely includes SUPERADMIN — the backend has
 * no extra restriction preventing a SUPERADMIN from creating another SUPERADMIN through this
 * endpoint, so the form must not invent one either.
 */
export interface CrearAdministradorInput {
  readonly nombre: string;
  readonly email: string;
  readonly password: string;
  readonly rol: AdminRole;
}

/** Body of the 201 response — the only fields the real backend returns, nothing invented. */
export interface CrearAdministradorResponse {
  readonly mensaje: string;
  readonly adminId: number;
  readonly rol: AdminRole;
}

/** Same three values as the `Rol` enum in openapi.yaml — no default preselected (see the schema's own comment: omitting rol must never silently grant a role). */
export const ADMIN_ROLE_OPTIONS: readonly AdminRole[] = ['SUPERADMIN', 'ANALISTA', 'COBRADOR'];

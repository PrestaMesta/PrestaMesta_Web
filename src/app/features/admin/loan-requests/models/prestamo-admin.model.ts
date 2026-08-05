/**
 * Field names and shapes mirror the API contract exactly (openapi.yaml `PrestamoAdminListItem` /
 * `PrestamoAdminDetalle` / `Pagination` / `CambiarEstadoInput`). `monto_solicitado`,
 * `monto_total_a_pagar` and `saldo_pendiente` are DECIMAL columns read back as-is from mysql2 —
 * kept as strings end-to-end, never parsed into a JS number, same rationale as the créditos
 * catalog (see ../../credits/utils/decimal.util.ts). This app only ever displays these values, it
 * never computes with them, so no decimal-arithmetic helper is needed here.
 */
export type EstadoPrestamo = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface CreditoResumen {
  readonly id: number;
  readonly nombre: string;
}

export interface ClienteResumen {
  readonly id: number;
  readonly nombre: string;
  readonly email: string;
}

/** Only id/nombre/email/telefono are ever exposed for the requesting client — never a password. */
export interface ClienteDetalleAdmin {
  readonly id: number;
  readonly nombre: string;
  readonly email: string;
  readonly telefono: string | null;
}

/** The full Credito shape (see ../../credits/models/credito.model.ts), nested in the admin detail. */
export interface CreditoDetalleAdmin {
  readonly id: number;
  readonly nombre: string;
  readonly monto_minimo: string;
  readonly monto_maximo: string;
  readonly tasa_interes_anual: string;
  readonly plazo_meses: number;
  readonly creado_en: string;
}

/** `null` when the loan has no aval on file — never an object with empty/zero placeholder fields. */
export interface AvalDetalle {
  readonly id: number;
  readonly nombre: string;
  readonly telefono: string;
  readonly direccion: string | null;
  readonly ingreso_mensual: string | null;
}

export interface PrestamoAdminListItem {
  readonly id: number;
  readonly cliente: ClienteResumen;
  readonly credito: CreditoResumen;
  readonly monto_solicitado: string;
  readonly monto_total_a_pagar: string;
  readonly saldo_pendiente: string;
  readonly estado: EstadoPrestamo;
  readonly fecha_solicitud: string;
  readonly fecha_decision: string | null;
}

export interface PrestamoAdminDetalle {
  readonly id: number;
  readonly cliente: ClienteDetalleAdmin;
  readonly credito: CreditoDetalleAdmin;
  readonly monto_solicitado: string;
  readonly monto_total_a_pagar: string;
  readonly saldo_pendiente: string;
  readonly estado: EstadoPrestamo;
  readonly fecha_solicitud: string;
  readonly fecha_decision: string | null;
  readonly aval: AvalDetalle | null;
}

export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PrestamoAdminListResponse {
  readonly data: readonly PrestamoAdminListItem[];
  readonly pagination: Pagination;
}

/**
 * Query filters for GET /admin/prestamos — exactly the set `filtrosAdminPrestamoSchema` accepts
 * (`.strict()`, so the backend 400s on any other key). `fecha_desde`/`fecha_hasta` are plain
 * `YYYY-MM-DD` strings, never a JS `Date` — the backend interprets them itself, and constructing a
 * `Date` client-side would risk a timezone-driven off-by-one-day mismatch with what the server
 * actually filters on.
 */
export interface PrestamoAdminFilters {
  readonly page: number;
  readonly limit: number;
  readonly estado?: EstadoPrestamo;
  readonly cliente_id?: number;
  readonly credito_id?: number;
  readonly fecha_desde?: string;
  readonly fecha_hasta?: string;
}

/** Body of PATCH /prestamos/:id/estado — only APROBADO/RECHAZADO are valid transitions here. */
export type CambiarEstadoAccion = 'APROBADO' | 'RECHAZADO';

export interface CambiarEstadoRequestBody {
  readonly estado: CambiarEstadoAccion;
  readonly motivo?: string;
}

export interface CambiarEstadoResponse {
  readonly mensaje: string;
}

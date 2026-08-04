/**
 * Field names match the API contract exactly (openapi.yaml `Credito`/`CreditoInput`) — no
 * camelCase mapping, so there is no translation layer that could silently drop or rename a field.
 * `monto_minimo`, `monto_maximo` and `tasa_interes_anual` are DECIMAL columns on the backend
 * (DECIMAL(12,2) / DECIMAL(5,2)) and round-trip as strings through mysql2; they are kept as
 * strings end-to-end here too — see ../utils/decimal.util.ts for why.
 */
export interface Credito {
  readonly id: number;
  readonly nombre: string;
  readonly monto_minimo: string;
  readonly monto_maximo: string;
  readonly tasa_interes_anual: string;
  readonly plazo_meses: number;
  readonly creado_en: string;
}

/**
 * Canonical form-facing shape for creating a credit: every field is the validated string the
 * Reactive Form holds (see credito-form.validators.ts) — monto/tasa as decimal strings,
 * plazo_meses as a digit string. Never sent over the wire as-is; converted to
 * `CreditoCreateRequestBody` only at the HTTP boundary (see ../services/credito-request.mapper.ts)
 * so no double/parseFloat arithmetic ever touches these values before that single, explicit cast.
 */
export interface CreditoFormValue {
  readonly nombre: string;
  readonly monto_minimo: string;
  readonly monto_maximo: string;
  readonly tasa_interes_anual: string;
  readonly plazo_meses: string;
}

/**
 * Exact JSON body of POST /prestamos/creditos. The OpenAPI `CreditoInput` schema types
 * monto_minimo/monto_maximo/tasa_interes_anual as `number` and is `additionalProperties: false` —
 * this interface is the wire contract, not a value the app computes with.
 */
export interface CreditoCreateRequestBody {
  readonly nombre: string;
  readonly monto_minimo: number;
  readonly monto_maximo: number;
  readonly tasa_interes_anual: number;
  readonly plazo_meses: number;
}

export interface CreditoCreatedResponse {
  readonly mensaje: string;
  readonly creditoId: number;
}

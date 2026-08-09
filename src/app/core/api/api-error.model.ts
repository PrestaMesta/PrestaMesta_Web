/** Error codes defined by the Prestamesta API contract (see ../../../../openapi.yaml ErrorEnvelope). */
export type ApiErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_EXISTS'
  | 'CREDIT_NOT_FOUND'
  | 'LOAN_NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'MFA_ENROLLMENT_REQUIRED'
  | 'MFA_CHALLENGE_REQUIRED'
  | 'MFA_ENROLLMENT_INVALID'
  | 'MFA_INVALID_CODE'
  | 'MFA_CODE_REUSED'
  | 'RECOVERY_CODE_ALREADY_USED'
  | 'MFA_RATE_LIMITED';

export interface ApiErrorEnvelope {
  readonly mensaje: string;
  readonly codigo?: ApiErrorCode;
  readonly requestId?: string;
  readonly detalles?: readonly { readonly campo: string; readonly mensaje: string }[];
}

/** Narrows an `HttpErrorResponse.error` body (`unknown`) without trusting its shape. */
export function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['mensaje'] === 'string'
  );
}

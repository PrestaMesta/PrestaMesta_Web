import { describe, expect, it } from 'vitest';
import { parseAdminMfaEnrollConfirmSession, parseAdminMfaFlow } from './admin-mfa.model';

const VALID = { preMfaToken: 'abc.def', siguientePaso: 'MFA_ENROLLMENT_REQUIRED' };

describe('parseAdminMfaFlow', () => {
  it('accepts a fully valid flow', () => {
    expect(parseAdminMfaFlow(VALID)).toEqual(VALID);
  });

  it('accepts every valid siguientePaso', () => {
    for (const siguientePaso of ['MFA_ENROLLMENT_REQUIRED', 'MFA_CHALLENGE_REQUIRED']) {
      expect(parseAdminMfaFlow({ ...VALID, siguientePaso })).not.toBeNull();
    }
  });

  it('rejects null, undefined, and non-objects', () => {
    expect(parseAdminMfaFlow(null)).toBeNull();
    expect(parseAdminMfaFlow(undefined)).toBeNull();
    expect(parseAdminMfaFlow('not an object')).toBeNull();
  });

  it('rejects a missing or empty preMfaToken', () => {
    expect(parseAdminMfaFlow({ ...VALID, preMfaToken: '' })).toBeNull();
    expect(parseAdminMfaFlow({ siguientePaso: VALID.siguientePaso })).toBeNull();
  });

  it('rejects a missing siguientePaso', () => {
    expect(parseAdminMfaFlow({ preMfaToken: 'abc' })).toBeNull();
  });

  it('rejects a siguientePaso outside the known enum (tampered storage)', () => {
    expect(parseAdminMfaFlow({ ...VALID, siguientePaso: 'ROOT_ACCESS' })).toBeNull();
  });
});

describe('parseAdminMfaEnrollConfirmSession', () => {
  const ADMIN = { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' as const };
  const VALID_RESPONSE = {
    mensaje: 'ok',
    token: 'jwt',
    admin: ADMIN,
    codigosRecuperacion: ['A1B2', 'C3D4'],
  };

  it('accepts a response with a non-empty codigosRecuperacion batch', () => {
    expect(parseAdminMfaEnrollConfirmSession(VALID_RESPONSE)).toEqual({
      token: 'jwt',
      admin: ADMIN,
      codigosRecuperacion: ['A1B2', 'C3D4'],
    });
  });

  it('rejects a response missing codigosRecuperacion entirely — a first enrollment always needs it', () => {
    const { codigosRecuperacion: _omit, ...withoutCodes } = VALID_RESPONSE;
    expect(parseAdminMfaEnrollConfirmSession(withoutCodes)).toBeNull();
  });

  it('rejects an empty codigosRecuperacion array', () => {
    expect(
      parseAdminMfaEnrollConfirmSession({ ...VALID_RESPONSE, codigosRecuperacion: [] }),
    ).toBeNull();
  });

  it('rejects a codigosRecuperacion array with non-string or blank entries (never trusts/pads with invented codes)', () => {
    expect(
      parseAdminMfaEnrollConfirmSession({ ...VALID_RESPONSE, codigosRecuperacion: ['A1B2', 42] }),
    ).toBeNull();
    expect(
      parseAdminMfaEnrollConfirmSession({ ...VALID_RESPONSE, codigosRecuperacion: ['A1B2', '  '] }),
    ).toBeNull();
  });

  it('rejects an otherwise-invalid session (missing token/admin) even with valid codes', () => {
    expect(
      parseAdminMfaEnrollConfirmSession({
        codigosRecuperacion: VALID_RESPONSE.codigosRecuperacion,
      }),
    ).toBeNull();
  });

  it('rejects null, undefined, and non-objects', () => {
    expect(parseAdminMfaEnrollConfirmSession(null)).toBeNull();
    expect(parseAdminMfaEnrollConfirmSession(undefined)).toBeNull();
    expect(parseAdminMfaEnrollConfirmSession('not an object')).toBeNull();
  });
});

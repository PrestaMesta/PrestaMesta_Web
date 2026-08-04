import { describe, expect, it } from 'vitest';
import { parseAdminSession } from './admin-session.model';

const VALID = {
  token: 'a.b.c',
  admin: { id: 1, nombre: 'Ana', email: 'ana@prestamesta.com', rol: 'SUPERADMIN' },
};

describe('parseAdminSession', () => {
  it('accepts a fully valid session', () => {
    expect(parseAdminSession(VALID)).toEqual(VALID);
  });

  it('rejects null, undefined, and non-objects', () => {
    expect(parseAdminSession(null)).toBeNull();
    expect(parseAdminSession(undefined)).toBeNull();
    expect(parseAdminSession('not an object')).toBeNull();
  });

  it('rejects a missing or empty token', () => {
    expect(parseAdminSession({ ...VALID, token: '' })).toBeNull();
    expect(parseAdminSession({ admin: VALID.admin })).toBeNull();
  });

  it('rejects a missing admin profile', () => {
    expect(parseAdminSession({ token: 'a.b.c' })).toBeNull();
    expect(parseAdminSession({ token: 'a.b.c', admin: null })).toBeNull();
  });

  it('rejects an admin profile with the wrong field types', () => {
    expect(parseAdminSession({ ...VALID, admin: { ...VALID.admin, id: '1' } })).toBeNull();
    expect(parseAdminSession({ ...VALID, admin: { ...VALID.admin, nombre: 42 } })).toBeNull();
  });

  it('rejects a role outside the known enum (tampered storage)', () => {
    expect(parseAdminSession({ ...VALID, admin: { ...VALID.admin, rol: 'ROOT' } })).toBeNull();
  });

  it('accepts every valid role', () => {
    for (const rol of ['SUPERADMIN', 'ANALISTA', 'COBRADOR']) {
      expect(parseAdminSession({ ...VALID, admin: { ...VALID.admin, rol } })).not.toBeNull();
    }
  });
});

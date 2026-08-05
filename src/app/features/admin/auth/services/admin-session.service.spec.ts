import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminSession } from '../models/admin-session.model';
import { ADMIN_SESSION_STORAGE_KEY, AdminSessionService } from './admin-session.service';

const SESSION: AdminSession = {
  token: 'a.b.c',
  admin: { id: 1, nombre: 'Ana', email: 'ana@prestamesta.com', rol: 'SUPERADMIN' },
};

// A key belonging to some unrelated feature on the same origin — never touched by this service.
// Isolation between tests removes only ADMIN_SESSION_STORAGE_KEY and this one key, never the
// whole storage: relying on a blanket sessionStorage.clear() here would hide a regression where
// AdminSessionService itself started calling clear() instead of removeItem().
const FOREIGN_KEY = 'some_other_feature_key';

function cleanupKnownKeys(): void {
  sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(FOREIGN_KEY);
}

describe('AdminSessionService (browser)', () => {
  beforeEach(() => {
    cleanupKnownKeys();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    cleanupKnownKeys();
  });

  it('starts with no session when storage is empty', () => {
    expect(TestBed.inject(AdminSessionService).isAuthenticated()).toBe(false);
  });

  it('restores a previously persisted session from sessionStorage', () => {
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(SESSION));
    const service = TestBed.inject(AdminSessionService);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.admin()).toEqual(SESSION.admin);
    expect(service.token()).toBe('a.b.c');
  });

  it('ignores a tampered/malformed value in storage', () => {
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify({ token: '' }));
    expect(TestBed.inject(AdminSessionService).isAuthenticated()).toBe(false);
  });

  it('set() persists the session to sessionStorage', () => {
    const service = TestBed.inject(AdminSessionService);
    service.set(SESSION);
    expect(service.isAuthenticated()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? 'null')).toEqual(
      SESSION,
    );
  });

  it('never writes to localStorage', () => {
    const service = TestBed.inject(AdminSessionService);
    service.set(SESSION);
    expect(localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clear() removes the session from memory and storage (logout)', () => {
    const service = TestBed.inject(AdminSessionService);
    service.set(SESSION);
    service.clear();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.admin()).toBeNull();
    expect(service.token()).toBeNull();
    expect(sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clear() (logout) removes only the admin session key — an unrelated sessionStorage key from the same origin survives', () => {
    sessionStorage.setItem(FOREIGN_KEY, 'untouched-value');
    const service = TestBed.inject(AdminSessionService);
    service.set(SESSION);

    service.clear();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.admin()).toBeNull();
    expect(service.token()).toBeNull();
    expect(sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(FOREIGN_KEY)).toBe('untouched-value');
  });
});

describe('AdminSessionService (SSR)', () => {
  beforeEach(() => {
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(SESSION));
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
  });

  afterEach(() => {
    cleanupKnownKeys();
  });

  it('never touches sessionStorage on the server and starts unauthenticated', () => {
    const service = TestBed.inject(AdminSessionService);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('set()/clear() do not throw when there is no browser storage', () => {
    const service = TestBed.inject(AdminSessionService);
    expect(() => service.set(SESSION)).not.toThrow();
    expect(service.isAuthenticated()).toBe(true);
    expect(() => service.clear()).not.toThrow();
  });
});

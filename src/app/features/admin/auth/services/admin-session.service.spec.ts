import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminSession } from '../models/admin-session.model';
import { AdminSessionService } from './admin-session.service';

const SESSION: AdminSession = {
  token: 'a.b.c',
  admin: { id: 1, nombre: 'Ana', email: 'ana@prestamesta.com', rol: 'SUPERADMIN' },
};
const STORAGE_KEY = 'prestamesta_admin_session';

describe('AdminSessionService (browser)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('starts with no session when storage is empty', () => {
    expect(TestBed.inject(AdminSessionService).isAuthenticated()).toBe(false);
  });

  it('restores a previously persisted session from sessionStorage', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(SESSION));
    const service = TestBed.inject(AdminSessionService);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.admin()).toEqual(SESSION.admin);
    expect(service.token()).toBe('a.b.c');
  });

  it('ignores a tampered/malformed value in storage', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: '' }));
    expect(TestBed.inject(AdminSessionService).isAuthenticated()).toBe(false);
  });

  it('set() persists the session to sessionStorage', () => {
    const service = TestBed.inject(AdminSessionService);
    service.set(SESSION);
    expect(service.isAuthenticated()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(SESSION);
  });

  it('never writes to localStorage', () => {
    const service = TestBed.inject(AdminSessionService);
    service.set(SESSION);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clear() removes the session from memory and storage (logout)', () => {
    const service = TestBed.inject(AdminSessionService);
    service.set(SESSION);
    service.clear();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.admin()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('AdminSessionService (SSR)', () => {
  beforeEach(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(SESSION));
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
  });

  afterEach(() => {
    sessionStorage.clear();
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

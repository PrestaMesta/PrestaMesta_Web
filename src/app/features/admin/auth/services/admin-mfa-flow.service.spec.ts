import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ADMIN_MFA_FLOW_STORAGE_KEY, AdminMfaFlowService } from './admin-mfa-flow.service';

const FOREIGN_KEY = 'some_other_feature_key';

function cleanupKnownKeys(): void {
  sessionStorage.removeItem(ADMIN_MFA_FLOW_STORAGE_KEY);
  sessionStorage.removeItem(FOREIGN_KEY);
}

describe('AdminMfaFlowService (browser)', () => {
  beforeEach(() => {
    cleanupKnownKeys();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    cleanupKnownKeys();
  });

  it('starts with no active flow when storage is empty', () => {
    const service = TestBed.inject(AdminMfaFlowService);
    expect(service.hasActiveFlow()).toBe(false);
    expect(service.preMfaToken()).toBeNull();
    expect(service.siguientePaso()).toBeNull();
  });

  it('start() persists the flow to sessionStorage under its own key', () => {
    const service = TestBed.inject(AdminMfaFlowService);
    service.start('pre-mfa-token', 'MFA_ENROLLMENT_REQUIRED');

    expect(service.hasActiveFlow()).toBe(true);
    expect(service.preMfaToken()).toBe('pre-mfa-token');
    expect(service.siguientePaso()).toBe('MFA_ENROLLMENT_REQUIRED');
    expect(JSON.parse(sessionStorage.getItem(ADMIN_MFA_FLOW_STORAGE_KEY) ?? 'null')).toEqual({
      preMfaToken: 'pre-mfa-token',
      siguientePaso: 'MFA_ENROLLMENT_REQUIRED',
    });
  });

  it('restores a previously persisted flow from sessionStorage', () => {
    sessionStorage.setItem(
      ADMIN_MFA_FLOW_STORAGE_KEY,
      JSON.stringify({ preMfaToken: 'abc', siguientePaso: 'MFA_CHALLENGE_REQUIRED' }),
    );
    const service = TestBed.inject(AdminMfaFlowService);

    expect(service.hasActiveFlow()).toBe(true);
    expect(service.preMfaToken()).toBe('abc');
    expect(service.siguientePaso()).toBe('MFA_CHALLENGE_REQUIRED');
  });

  it('ignores a tampered/malformed value in storage', () => {
    sessionStorage.setItem(ADMIN_MFA_FLOW_STORAGE_KEY, JSON.stringify({ preMfaToken: '' }));
    expect(TestBed.inject(AdminMfaFlowService).hasActiveFlow()).toBe(false);
  });

  it('rejects a siguientePaso outside the known enum (tampered storage)', () => {
    sessionStorage.setItem(
      ADMIN_MFA_FLOW_STORAGE_KEY,
      JSON.stringify({ preMfaToken: 'abc', siguientePaso: 'ROOT_ACCESS' }),
    );
    expect(TestBed.inject(AdminMfaFlowService).hasActiveFlow()).toBe(false);
  });

  it('never writes to localStorage', () => {
    const service = TestBed.inject(AdminMfaFlowService);
    service.start('pre-mfa-token', 'MFA_ENROLLMENT_REQUIRED');
    expect(localStorage.getItem(ADMIN_MFA_FLOW_STORAGE_KEY)).toBeNull();
  });

  it('clear() removes the flow from memory and storage — an unrelated sessionStorage key survives', () => {
    sessionStorage.setItem(FOREIGN_KEY, 'untouched-value');
    const service = TestBed.inject(AdminMfaFlowService);
    service.start('pre-mfa-token', 'MFA_ENROLLMENT_REQUIRED');

    service.clear();

    expect(service.hasActiveFlow()).toBe(false);
    expect(service.preMfaToken()).toBeNull();
    expect(sessionStorage.getItem(ADMIN_MFA_FLOW_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(FOREIGN_KEY)).toBe('untouched-value');
  });

  it('start() overwrites a previous flow (e.g. discovering the real step mid-flow)', () => {
    const service = TestBed.inject(AdminMfaFlowService);
    service.start('pre-mfa-token', 'MFA_ENROLLMENT_REQUIRED');

    service.start('pre-mfa-token', 'MFA_CHALLENGE_REQUIRED');

    expect(service.siguientePaso()).toBe('MFA_CHALLENGE_REQUIRED');
  });
});

describe('AdminMfaFlowService (SSR)', () => {
  beforeEach(() => {
    sessionStorage.setItem(
      ADMIN_MFA_FLOW_STORAGE_KEY,
      JSON.stringify({ preMfaToken: 'abc', siguientePaso: 'MFA_CHALLENGE_REQUIRED' }),
    );
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
  });

  afterEach(() => {
    cleanupKnownKeys();
  });

  it('never touches sessionStorage on the server and starts with no active flow', () => {
    const service = TestBed.inject(AdminMfaFlowService);
    expect(service.hasActiveFlow()).toBe(false);
  });

  it('start()/clear() do not throw when there is no browser storage', () => {
    const service = TestBed.inject(AdminMfaFlowService);
    expect(() => service.start('t', 'MFA_ENROLLMENT_REQUIRED')).not.toThrow();
    expect(service.hasActiveFlow()).toBe(true);
    expect(() => service.clear()).not.toThrow();
  });
});

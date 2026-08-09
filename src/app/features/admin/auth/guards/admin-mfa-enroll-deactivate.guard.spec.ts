import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMfaEnrollPage } from '../pages/admin-mfa-enroll-page/admin-mfa-enroll-page';
import { adminMfaEnrollDeactivateGuard } from './admin-mfa-enroll-deactivate.guard';

function fakeComponent(recoveryCodes: readonly string[] | null): AdminMfaEnrollPage {
  const abandonEnrollment = vi.fn();
  return {
    recoveryCodes: () => recoveryCodes,
    abandonEnrollment,
  } as unknown as AdminMfaEnrollPage;
}

function runGuard(component: AdminMfaEnrollPage, platformId: 'browser' | 'server' = 'browser') {
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platformId }] });
  return TestBed.runInInjectionContext(() =>
    adminMfaEnrollDeactivateGuard(component, {} as never, {} as never, {} as never),
  );
}

describe('adminMfaEnrollDeactivateGuard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows leaving freely when there are no pending recovery codes', () => {
    const component = fakeComponent(null);

    const result = runGuard(component);

    expect(result).toBe(true);
    expect(component.abandonEnrollment).not.toHaveBeenCalled();
  });

  describe('with recovery codes pending', () => {
    let confirmSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      confirmSpy = vi.spyOn(window, 'confirm');
    });

    it('asks for confirmation, and staying (cancel) blocks navigation without touching component state', () => {
      confirmSpy.mockReturnValue(false);
      const component = fakeComponent(['CODE-1', 'CODE-2']);

      const result = runGuard(component);

      expect(confirmSpy).toHaveBeenCalledOnce();
      expect(result).toBe(false);
      expect(component.abandonEnrollment).not.toHaveBeenCalled();
    });

    it('confirming the prompt allows navigation and clears the pending token/codes via abandonEnrollment()', () => {
      confirmSpy.mockReturnValue(true);
      const component = fakeComponent(['CODE-1', 'CODE-2']);

      const result = runGuard(component);

      expect(result).toBe(true);
      expect(component.abandonEnrollment).toHaveBeenCalledOnce();
    });

    it('is SSR-safe — never calls window.confirm outside the browser, and allows navigation', () => {
      const component = fakeComponent(['CODE-1', 'CODE-2']);

      const result = runGuard(component, 'server');

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(result).toBe(true);
      expect(component.abandonEnrollment).not.toHaveBeenCalled();
    });
  });
});

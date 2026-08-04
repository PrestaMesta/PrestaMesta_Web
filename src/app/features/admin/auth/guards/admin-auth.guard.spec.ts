import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AdminSessionService } from '../services/admin-session.service';
import { adminAuthGuard } from './admin-auth.guard';

function runGuard(isAuthenticated: boolean, url = '/admin') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AdminSessionService, useValue: { isAuthenticated: signal(isAuthenticated) } },
    ],
  });

  return TestBed.runInInjectionContext(() =>
    adminAuthGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
}

describe('adminAuthGuard', () => {
  it('allows access when a session exists', () => {
    expect(runGuard(true)).toBe(true);
  });

  it('redirects to /admin/login with a returnUrl when there is no session', () => {
    const result = runGuard(false, '/admin/creditos') as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/admin/login?returnUrl=%2Fadmin%2Fcreditos');
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AdminProfile } from '../models/admin-session.model';
import { AdminSessionService } from '../services/admin-session.service';
import { adminLoanAccessGuard } from './admin-loan-access.guard';

function runGuard(admin: AdminProfile | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
    ],
  });

  return TestBed.runInInjectionContext(() => adminLoanAccessGuard({} as never, {} as never));
}

describe('adminLoanAccessGuard', () => {
  it('allows a SUPERADMIN through', () => {
    expect(runGuard({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'SUPERADMIN' })).toBe(true);
  });

  it('allows an ANALISTA through', () => {
    expect(runGuard({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' })).toBe(true);
  });

  it('redirects a COBRADOR to /admin — no access to loan requests at all', () => {
    const result = runGuard({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'COBRADOR' }) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/admin');
  });

  it('redirects when there is no session at all', () => {
    const result = runGuard(null) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
  });
});

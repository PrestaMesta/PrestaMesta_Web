import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AdminProfile } from '../models/admin-session.model';
import { AdminSessionService } from '../services/admin-session.service';
import { adminSuperadminGuard } from './admin-superadmin.guard';

function runGuard(admin: AdminProfile | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
    ],
  });

  return TestBed.runInInjectionContext(() => adminSuperadminGuard({} as never, {} as never));
}

describe('adminSuperadminGuard', () => {
  it('allows a SUPERADMIN through', () => {
    expect(runGuard({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'SUPERADMIN' })).toBe(true);
  });

  it('redirects an ANALISTA to /admin', () => {
    const result = runGuard({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' }) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/admin');
  });

  it('redirects a COBRADOR to /admin', () => {
    const result = runGuard({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'COBRADOR' }) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('redirects when there is no session at all', () => {
    const result = runGuard(null) as UrlTree;
    expect(result).toBeInstanceOf(UrlTree);
  });
});

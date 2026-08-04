import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { AdminProfile } from '../../auth/models/admin-session.model';
import { AdminAuthService } from '../../auth/services/admin-auth.service';
import { AdminSessionService } from '../../auth/services/admin-session.service';
import { AdminShell } from './admin-shell';

function createFixture(admin: AdminProfile) {
  const logout = vi.fn();
  TestBed.configureTestingModule({
    imports: [AdminShell],
    providers: [
      provideRouter([]),
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
      { provide: AdminAuthService, useValue: { logout } },
    ],
  });
  const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AdminShell);
  fixture.detectChanges();
  return { fixture, logout, navigateByUrl };
}

describe('AdminShell', () => {
  it('shows Inicio, Créditos and Solicitudes for an ANALISTA, but not Administradores', () => {
    const { fixture } = createFixture({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' });
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Inicio');
    expect(text).toContain('Créditos');
    expect(text).toContain('Solicitudes');
    expect(text).not.toContain('Administradores');
  });

  it('shows Inicio, Créditos and Solicitudes for a COBRADOR, but not Administradores', () => {
    const { fixture } = createFixture({ id: 1, nombre: 'Bob', email: 'b@b.com', rol: 'COBRADOR' });
    expect(fixture.nativeElement.textContent).not.toContain('Administradores');
  });

  it('shows Administradores for a SUPERADMIN', () => {
    const { fixture } = createFixture({
      id: 1,
      nombre: 'Sara',
      email: 's@b.com',
      rol: 'SUPERADMIN',
    });
    expect(fixture.nativeElement.textContent).toContain('Administradores');
  });

  it('logout() clears the session via AdminAuthService and redirects to /admin/login', () => {
    const { fixture, logout, navigateByUrl } = createFixture({
      id: 1,
      nombre: 'Sara',
      email: 's@b.com',
      rol: 'SUPERADMIN',
    });

    fixture.componentInstance.logout();

    expect(logout).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });
});

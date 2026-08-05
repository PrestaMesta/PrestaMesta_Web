import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../../core/services/seo.service';
import { AdminProfile } from '../../auth/models/admin-session.model';
import { AdminAuthService } from '../../auth/services/admin-auth.service';
import { AdminSessionService } from '../../auth/services/admin-session.service';
import { AdminShell } from './admin-shell';

@Component({ template: '', standalone: true })
class StubPage {}

const STUB_ROUTES = [
  {
    path: 'admin',
    children: [
      { path: '', pathMatch: 'full' as const, component: StubPage },
      { path: 'creditos', component: StubPage },
      { path: 'solicitudes', component: StubPage },
      { path: 'administradores', component: StubPage },
    ],
  },
];

function createFixture(admin: AdminProfile) {
  const logout = vi.fn();
  const setNoIndex = vi.fn();
  TestBed.configureTestingModule({
    imports: [AdminShell],
    providers: [
      provideRouter(STUB_ROUTES),
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
      { provide: AdminAuthService, useValue: { logout } },
      { provide: SeoService, useValue: { setNoIndex, updateMetadata: vi.fn() } },
    ],
  });
  const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AdminShell);
  fixture.detectChanges();
  return { fixture, logout, navigateByUrl, setNoIndex };
}

/**
 * Unlike `createFixture()`, this leaves `Router.navigateByUrl` unmocked — needed for tests that
 * actually navigate and assert on the resulting `routerLinkActive`/focus state, not just on what
 * URL a click would have targeted.
 */
function createFixtureWithRealRouter(admin: AdminProfile) {
  TestBed.configureTestingModule({
    imports: [AdminShell],
    providers: [
      provideRouter(STUB_ROUTES),
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
      { provide: AdminAuthService, useValue: { logout: vi.fn() } },
      { provide: SeoService, useValue: { setNoIndex: vi.fn(), updateMetadata: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(AdminShell);
  fixture.detectChanges();
  return { fixture, router: TestBed.inject(Router) };
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

  it('shows only Inicio and Créditos for a COBRADOR — no Solicitudes (zero backend access) and no Administradores', () => {
    const { fixture } = createFixture({ id: 1, nombre: 'Bob', email: 'b@b.com', rol: 'COBRADOR' });
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Inicio');
    expect(text).toContain('Créditos');
    expect(text).not.toContain('Solicitudes');
    expect(text).not.toContain('Administradores');
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

  it('marks the panel noindex on construction, regardless of render mode', () => {
    const { setNoIndex } = createFixture({
      id: 1,
      nombre: 'Sara',
      email: 's@b.com',
      rol: 'SUPERADMIN',
    });

    expect(setNoIndex).toHaveBeenCalledOnce();
  });

  it('marks the active nav link with aria-current="page", and no other link', async () => {
    const { fixture, router } = createFixtureWithRealRouter({
      id: 1,
      nombre: 'Sara',
      email: 's@b.com',
      rol: 'SUPERADMIN',
    });

    await router.navigateByUrl('/admin/creditos');
    await fixture.whenStable();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const creditosLink = links.find((a) => a.textContent?.includes('Créditos'));
    const inicioLink = links.find((a) => a.textContent?.includes('Inicio'));

    expect(creditosLink?.getAttribute('aria-current')).toBe('page');
    expect(inicioLink?.hasAttribute('aria-current')).toBe(false);
  });

  it('moves focus to the main content landmark on every navigation', async () => {
    const { fixture, router } = createFixtureWithRealRouter({
      id: 1,
      nombre: 'Sara',
      email: 's@b.com',
      rol: 'SUPERADMIN',
    });

    await router.navigateByUrl('/admin/creditos');
    await fixture.whenStable();

    const main = fixture.nativeElement.querySelector('main');
    expect(document.activeElement).toBe(main);
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AdminProfile } from '../../auth/models/admin-session.model';
import { AdminSessionService } from '../../auth/services/admin-session.service';
import { AdminHomePage } from './admin-home-page';

function createFixture(admin: AdminProfile) {
  TestBed.configureTestingModule({
    imports: [AdminHomePage],
    providers: [
      provideRouter([]),
      { provide: AdminSessionService, useValue: { admin: signal(admin) } },
    ],
  });
  const fixture = TestBed.createComponent(AdminHomePage);
  fixture.detectChanges();
  return fixture;
}

describe('AdminHomePage', () => {
  it('greets the admin by name and shows their role', () => {
    const fixture = createFixture({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' });
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Hola, Ana');
    expect(text).toContain('ANALISTA');
  });

  it('shows quick access to Créditos and Solicitudes for an ANALISTA, but not Administradores', () => {
    const fixture = createFixture({ id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' });
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Créditos');
    expect(text).toContain('Solicitudes');
    expect(text).not.toContain('Administradores');
  });

  it('shows quick access to every module for a SUPERADMIN', () => {
    const fixture = createFixture({ id: 1, nombre: 'Sara', email: 's@b.com', rol: 'SUPERADMIN' });
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Créditos');
    expect(text).toContain('Solicitudes');
    expect(text).toContain('Administradores');
  });

  it('shows quick access to only Créditos for a COBRADOR — no Solicitudes, no Administradores', () => {
    const fixture = createFixture({ id: 1, nombre: 'Bob', email: 'b@b.com', rol: 'COBRADOR' });
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Créditos');
    expect(text).not.toContain('Solicitudes');
    expect(text).not.toContain('Administradores');
  });

  it('never renders the "Inicio" link on its own quick-access list', () => {
    const fixture = createFixture({ id: 1, nombre: 'Sara', email: 's@b.com', rol: 'SUPERADMIN' });
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];

    expect(links.some((a) => a.getAttribute('href') === '/admin')).toBe(false);
  });

  it('never invents metrics, counts, or activity summaries', () => {
    const fixture = createFixture({ id: 1, nombre: 'Sara', email: 's@b.com', rol: 'SUPERADMIN' });
    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toMatch(/\d+\s*(solicitudes|créditos|administradores)/i);
    expect(text.toLowerCase()).not.toContain('métrica');
    expect(text.toLowerCase()).not.toContain('resumen');
  });
});

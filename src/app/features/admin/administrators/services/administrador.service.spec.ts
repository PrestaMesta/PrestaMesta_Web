import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_AUTH_REQUIRED } from '../../../../core/interceptors/admin-auth.context';
import { CrearAdministradorInput } from '../models/administrador.model';
import { AdministradorService } from './administrador.service';

const BASE_URL = 'https://apitest.prestamesta.fun/api/v1';
const CREATE_URL = `${BASE_URL}/admin/administradores`;

const INPUT: CrearAdministradorInput = {
  nombre: 'Nuevo Analista',
  email: 'analista@prestamesta.com',
  password: 'SegurA123456',
  rol: 'ANALISTA',
};

describe('AdministradorService', () => {
  let service: AdministradorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfigService, useValue: { baseUrl: signal(BASE_URL) } },
      ],
    });
    service = TestBed.inject(AdministradorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('POSTs the exact body with no additional keys, and marks ADMIN_AUTH_REQUIRED', async () => {
    const resultPromise = new Promise((resolve) => service.create(INPUT).subscribe(resolve));

    const req = httpMock.expectOne(CREATE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(INPUT);
    expect(Object.keys(req.request.body).sort()).toEqual(['email', 'nombre', 'password', 'rol']);
    expect(req.request.context.get(ADMIN_AUTH_REQUIRED)).toBe(true);

    req.flush({ mensaje: 'Administrador creado exitosamente', adminId: 2, rol: 'ANALISTA' });

    expect(await resultPromise).toEqual({
      mensaje: 'Administrador creado exitosamente',
      adminId: 2,
      rol: 'ANALISTA',
    });
  });

  it('allows creating a SUPERADMIN — the backend does not restrict this role for this endpoint', () => {
    service.create({ ...INPUT, rol: 'SUPERADMIN' }).subscribe();

    const req = httpMock.expectOne(CREATE_URL);
    expect(req.request.body.rol).toBe('SUPERADMIN');
    req.flush({ mensaje: 'ok', adminId: 3, rol: 'SUPERADMIN' });
  });

  it('propagates a 400 VALIDATION_ERROR', () => {
    let error: unknown;
    service.create(INPUT).subscribe({ error: (e) => (error = e) });

    httpMock
      .expectOne(CREATE_URL)
      .flush(
        { mensaje: 'Los datos enviados no son validos.', codigo: 'VALIDATION_ERROR' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect((error as HttpErrorResponse).status).toBe(400);
  });

  it('propagates a 403 (role no longer SUPERADMIN)', () => {
    let error: unknown;
    service.create(INPUT).subscribe({ error: (e) => (error = e) });

    httpMock
      .expectOne(CREATE_URL)
      .flush(
        { mensaje: 'Tu rol no tiene permiso para esta accion.', codigo: 'FORBIDDEN' },
        { status: 403, statusText: 'Forbidden' },
      );

    expect((error as HttpErrorResponse).status).toBe(403);
  });

  it('propagates a 409 EMAIL_ALREADY_EXISTS', () => {
    let error: unknown;
    service.create(INPUT).subscribe({ error: (e) => (error = e) });

    httpMock.expectOne(CREATE_URL).flush(
      {
        mensaje: 'El correo ya esta registrado para un administrador.',
        codigo: 'EMAIL_ALREADY_EXISTS',
      },
      { status: 409, statusText: 'Conflict' },
    );

    const httpError = error as HttpErrorResponse;
    expect(httpError.status).toBe(409);
    expect(httpError.error.codigo).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('propagates a 500', () => {
    let error: unknown;
    service.create(INPUT).subscribe({ error: (e) => (error = e) });

    httpMock
      .expectOne(CREATE_URL)
      .flush(
        { mensaje: 'Error interno', codigo: 'INTERNAL_ERROR' },
        { status: 500, statusText: 'Server Error' },
      );

    expect((error as HttpErrorResponse).status).toBe(500);
  });
});

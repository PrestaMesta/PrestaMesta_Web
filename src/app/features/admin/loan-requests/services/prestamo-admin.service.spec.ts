import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_AUTH_REQUIRED } from '../../../../core/interceptors/admin-auth.context';
import {
  PrestamoAdminDetalle,
  PrestamoAdminFilters,
  PrestamoAdminListItem,
} from '../models/prestamo-admin.model';
import { PrestamoAdminService } from './prestamo-admin.service';

const BASE_URL = 'https://apitest.prestamesta.fun/api/v1';
const LIST_URL = `${BASE_URL}/admin/prestamos`;

const LIST_ITEM: PrestamoAdminListItem = {
  id: 1,
  cliente: { id: 7, nombre: 'Juan Pérez', email: 'juan@example.com' },
  credito: { id: 1, nombre: 'Crédito Personal Express' },
  monto_solicitado: '10000.00',
  monto_total_a_pagar: '12400.00',
  saldo_pendiente: '12400.00',
  estado: 'PENDIENTE',
  fecha_solicitud: '2026-08-02T20:46:06.000Z',
  fecha_decision: null,
};

const DETALLE: PrestamoAdminDetalle = {
  ...LIST_ITEM,
  cliente: { id: 7, nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '8711234567' },
  credito: {
    id: 1,
    nombre: 'Crédito Personal Express',
    monto_minimo: '1000.00',
    monto_maximo: '20000.00',
    tasa_interes_anual: '24.00',
    plazo_meses: 12,
    creado_en: '2026-08-02T02:43:54.000Z',
  },
  aval: null,
};

describe('PrestamoAdminService', () => {
  let service: PrestamoAdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfigService, useValue: { baseUrl: signal(BASE_URL) } },
      ],
    });
    service = TestBed.inject(PrestamoAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('list()', () => {
    it('always sends page and limit, marks ADMIN_AUTH_REQUIRED, and returns the page', async () => {
      const resultPromise = new Promise((resolve) =>
        service.list({ page: 2, limit: 20 }).subscribe(resolve),
      );

      const req = httpMock.expectOne(
        (r) => r.url === LIST_URL && r.params.get('page') === '2' && r.params.get('limit') === '20',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.context.get(ADMIN_AUTH_REQUIRED)).toBe(true);

      const body = {
        data: [LIST_ITEM],
        pagination: { page: 2, limit: 20, total: 21, totalPages: 2 },
      };
      req.flush(body);

      expect(await resultPromise).toEqual(body);
    });

    it('omits every optional filter that is not supplied', () => {
      service.list({ page: 1, limit: 20 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === LIST_URL);
      expect(req.request.params.has('estado')).toBe(false);
      expect(req.request.params.has('cliente_id')).toBe(false);
      expect(req.request.params.has('credito_id')).toBe(false);
      expect(req.request.params.has('fecha_desde')).toBe(false);
      expect(req.request.params.has('fecha_hasta')).toBe(false);
      req.flush({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    });

    it('sends only the supported filters when supplied — estado', () => {
      service.list({ page: 1, limit: 20, estado: 'PENDIENTE' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === LIST_URL);
      expect(req.request.params.get('estado')).toBe('PENDIENTE');
      req.flush({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    });

    it('sends only the supported filters when supplied — cliente_id and credito_id', () => {
      service.list({ page: 1, limit: 20, cliente_id: 7, credito_id: 1 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === LIST_URL);
      expect(req.request.params.get('cliente_id')).toBe('7');
      expect(req.request.params.get('credito_id')).toBe('1');
      req.flush({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    });

    it('sends only the supported filters when supplied — fecha_desde and fecha_hasta', () => {
      const filters: PrestamoAdminFilters = {
        page: 1,
        limit: 20,
        fecha_desde: '2026-01-01',
        fecha_hasta: '2026-01-31',
      };
      service.list(filters).subscribe();

      const req = httpMock.expectOne((r) => r.url === LIST_URL);
      expect(req.request.params.get('fecha_desde')).toBe('2026-01-01');
      expect(req.request.params.get('fecha_hasta')).toBe('2026-01-31');
      req.flush({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    });

    it('propagates a 403 without altering the request (session handling is the interceptor/component job)', () => {
      let error: unknown;
      service.list({ page: 1, limit: 20 }).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((r) => r.url === LIST_URL)
        .flush(
          { mensaje: 'Tu rol no tiene permiso para esta accion.', codigo: 'FORBIDDEN' },
          { status: 403, statusText: 'Forbidden' },
        );

      expect((error as HttpErrorResponse).status).toBe(403);
    });

    it('propagates a 500', () => {
      let error: unknown;
      service.list({ page: 1, limit: 20 }).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((r) => r.url === LIST_URL)
        .flush(
          { mensaje: 'Error interno', codigo: 'INTERNAL_ERROR' },
          { status: 500, statusText: 'Server Error' },
        );

      expect((error as HttpErrorResponse).status).toBe(500);
    });
  });

  describe('getById()', () => {
    it('requests the detail by id and marks ADMIN_AUTH_REQUIRED', async () => {
      const resultPromise = new Promise((resolve) => service.getById(1).subscribe(resolve));

      const req = httpMock.expectOne(`${BASE_URL}/admin/prestamos/1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.context.get(ADMIN_AUTH_REQUIRED)).toBe(true);

      req.flush(DETALLE);

      expect(await resultPromise).toEqual(DETALLE);
    });

    it('resolves aval as null when the loan has none', async () => {
      const resultPromise = new Promise<PrestamoAdminDetalle>((resolve) =>
        service.getById(1).subscribe(resolve),
      );

      httpMock.expectOne(`${BASE_URL}/admin/prestamos/1`).flush(DETALLE);

      expect((await resultPromise).aval).toBeNull();
    });

    it('resolves a populated aval when the loan has one', async () => {
      const withAval: PrestamoAdminDetalle = {
        ...DETALLE,
        aval: {
          id: 5,
          nombre: 'Roberto Gómez',
          telefono: '8711234567',
          direccion: 'Av. Morelos #450, Centro',
          ingreso_mensual: '15000.00',
        },
      };
      const resultPromise = new Promise<PrestamoAdminDetalle>((resolve) =>
        service.getById(1).subscribe(resolve),
      );

      httpMock.expectOne(`${BASE_URL}/admin/prestamos/1`).flush(withAval);

      const result = await resultPromise;
      expect(result.aval).not.toBeNull();
      expect(result.aval?.nombre).toBe('Roberto Gómez');
    });

    it('propagates a 404 LOAN_NOT_FOUND for a nonexistent loan', () => {
      let error: unknown;
      service.getById(999).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne(`${BASE_URL}/admin/prestamos/999`)
        .flush(
          { mensaje: 'Prestamo no encontrado.', codigo: 'LOAN_NOT_FOUND' },
          { status: 404, statusText: 'Not Found' },
        );

      const httpError = error as HttpErrorResponse;
      expect(httpError.status).toBe(404);
      expect(httpError.error.codigo).toBe('LOAN_NOT_FOUND');
    });
  });

  describe('cambiarEstado()', () => {
    it('PATCHes /prestamos/:id/estado (not /admin/prestamos) and marks ADMIN_AUTH_REQUIRED', async () => {
      const resultPromise = new Promise((resolve) =>
        service.cambiarEstado(1, { estado: 'APROBADO' }).subscribe(resolve),
      );

      const req = httpMock.expectOne(`${BASE_URL}/prestamos/1/estado`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ estado: 'APROBADO' });
      expect(req.request.context.get(ADMIN_AUTH_REQUIRED)).toBe(true);

      req.flush({ mensaje: 'El prestamo #1 ha sido aprobado exitosamente.' });

      expect(await resultPromise).toEqual({
        mensaje: 'El prestamo #1 ha sido aprobado exitosamente.',
      });
    });

    it('sends an optional motivo when supplied', () => {
      service.cambiarEstado(1, { estado: 'RECHAZADO', motivo: 'No cumple perfil' }).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/prestamos/1/estado`);
      expect(req.request.body).toEqual({ estado: 'RECHAZADO', motivo: 'No cumple perfil' });
      req.flush({ mensaje: 'ok' });
    });

    it('propagates a 404 LOAN_NOT_FOUND for a nonexistent loan', () => {
      let error: unknown;
      service.cambiarEstado(999, { estado: 'APROBADO' }).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne(`${BASE_URL}/prestamos/999/estado`)
        .flush(
          { mensaje: 'Prestamo no encontrado.', codigo: 'LOAN_NOT_FOUND' },
          { status: 404, statusText: 'Not Found' },
        );

      const httpError = error as HttpErrorResponse;
      expect(httpError.status).toBe(404);
      expect(httpError.error.codigo).toBe('LOAN_NOT_FOUND');
    });

    it('propagates a 409 INVALID_TRANSITION when the loan is no longer PENDIENTE', () => {
      let error: unknown;
      service.cambiarEstado(1, { estado: 'APROBADO' }).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${BASE_URL}/prestamos/1/estado`).flush(
        {
          mensaje: 'El prestamo ya no esta pendiente de revision.',
          codigo: 'INVALID_TRANSITION',
        },
        { status: 409, statusText: 'Conflict' },
      );

      const httpError = error as HttpErrorResponse;
      expect(httpError.status).toBe(409);
      expect(httpError.error.codigo).toBe('INVALID_TRANSITION');
    });

    it('propagates a 403 (role no longer permitted, e.g. race with a role change)', () => {
      let error: unknown;
      service.cambiarEstado(1, { estado: 'APROBADO' }).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne(`${BASE_URL}/prestamos/1/estado`)
        .flush(
          { mensaje: 'Tu rol no tiene permiso para esta accion.', codigo: 'FORBIDDEN' },
          { status: 403, statusText: 'Forbidden' },
        );

      expect((error as HttpErrorResponse).status).toBe(403);
    });
  });
});

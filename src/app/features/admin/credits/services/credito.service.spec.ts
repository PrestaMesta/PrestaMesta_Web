import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_AUTH_REQUIRED } from '../../../../core/interceptors/admin-auth.context';
import { Credito, CreditoFormValue } from '../models/credito.model';
import { CreditoService } from './credito.service';

const BASE_URL = 'https://apitest.prestamesta.fun/api/v1';
const CREDITOS_URL = `${BASE_URL}/prestamos/creditos`;

const FORM_VALUE: CreditoFormValue = {
  nombre: 'Crédito Personal Express',
  monto_minimo: '1000.00',
  monto_maximo: '20000.00',
  tasa_interes_anual: '24.00',
  plazo_meses: '12',
};

describe('CreditoService', () => {
  let service: CreditoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiConfigService, useValue: { baseUrl: signal(BASE_URL) } },
      ],
    });
    service = TestBed.inject(CreditoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('lists the catalog with GET and marks the request ADMIN_AUTH_REQUIRED', async () => {
    const resultPromise = new Promise((resolve) => service.list().subscribe(resolve));

    const req = httpMock.expectOne(CREDITOS_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(ADMIN_AUTH_REQUIRED)).toBe(true);

    const credits = [
      {
        id: 1,
        nombre: 'Crédito Personal Express',
        monto_minimo: '1000.00',
        monto_maximo: '20000.00',
        tasa_interes_anual: '24.00',
        plazo_meses: 12,
        creado_en: '2026-08-02T02:43:54.000Z',
      },
    ];
    req.flush(credits);

    const result = await resultPromise;
    expect(result).toEqual(credits);
  });

  it('GET response keeps monto_minimo/monto_maximo/tasa_interes_anual as strings (untouched DECIMAL passthrough)', async () => {
    const resultPromise = new Promise<Credito[]>((resolve) => service.list().subscribe(resolve));

    const req = httpMock.expectOne(CREDITOS_URL);
    req.flush([
      {
        id: 1,
        nombre: 'Crédito Personal Express',
        monto_minimo: '1000.00',
        monto_maximo: '20000.00',
        tasa_interes_anual: '24.00',
        plazo_meses: 12,
        creado_en: '2026-08-02T02:43:54.000Z',
      },
    ]);

    const [credito] = await resultPromise;
    expect(typeof credito.monto_minimo).toBe('string');
    expect(typeof credito.monto_maximo).toBe('string');
    expect(typeof credito.tasa_interes_anual).toBe('string');
    expect(typeof credito.plazo_meses).toBe('number');
  });

  it('creates a credit with POST and marks ADMIN_AUTH_REQUIRED', async () => {
    const resultPromise = new Promise((resolve) => service.create(FORM_VALUE).subscribe(resolve));

    const req = httpMock.expectOne(CREDITOS_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(ADMIN_AUTH_REQUIRED)).toBe(true);

    req.flush({ mensaje: 'Tipo de crédito creado con éxito', creditoId: 1 });

    expect(await resultPromise).toEqual({
      mensaje: 'Tipo de crédito creado con éxito',
      creditoId: 1,
    });
  });

  it('sends the exact JSON body: monto/tasa as numbers, plazo_meses as an integer, no other keys', () => {
    service.create(FORM_VALUE).subscribe();

    const req = httpMock.expectOne(CREDITOS_URL);
    expect(req.request.body).toEqual({
      nombre: 'Crédito Personal Express',
      monto_minimo: 1000,
      monto_maximo: 20000,
      tasa_interes_anual: 24,
      plazo_meses: 12,
    });
    expect(Object.keys(req.request.body).sort()).toEqual([
      'monto_maximo',
      'monto_minimo',
      'nombre',
      'plazo_meses',
      'tasa_interes_anual',
    ]);
    req.flush({ mensaje: 'ok', creditoId: 1 });
  });

  it('never sends monto/tasa as strings in the POST body', () => {
    service.create(FORM_VALUE).subscribe();

    const req = httpMock.expectOne(CREDITOS_URL);
    expect(typeof req.request.body.monto_minimo).toBe('number');
    expect(typeof req.request.body.monto_maximo).toBe('number');
    expect(typeof req.request.body.tasa_interes_anual).toBe('number');
    expect(typeof req.request.body.plazo_meses).toBe('number');
    req.flush({ mensaje: 'ok', creditoId: 1 });
  });

  it('preserves a value like 1000.50 exactly as 1000.5 in the JSON body, never truncated', () => {
    service.create({ ...FORM_VALUE, monto_minimo: '1000.50' }).subscribe();

    const req = httpMock.expectOne(CREDITOS_URL);
    expect(req.request.body.monto_minimo).toBe(1000.5);
    req.flush({ mensaje: 'ok', creditoId: 1 });
  });

  it('errors without making an HTTP request when a field is not in its canonical form', () => {
    let error: unknown;
    service
      .create({ ...FORM_VALUE, monto_minimo: 'not-a-number' })
      .subscribe({ error: (e) => (error = e) });

    httpMock.expectNone(CREDITOS_URL);
    expect(error).toBeInstanceOf(Error);
  });
});

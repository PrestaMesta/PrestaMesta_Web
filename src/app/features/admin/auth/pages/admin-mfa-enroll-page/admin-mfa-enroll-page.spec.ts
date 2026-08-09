import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../../../../core/services/seo.service';
import { adminAuthGuard } from '../../guards/admin-auth.guard';
import { AdminMfaFlowService } from '../../services/admin-mfa-flow.service';
import { AdminMfaService } from '../../services/admin-mfa.service';
import {
  ADMIN_SESSION_STORAGE_KEY,
  AdminSessionService,
} from '../../services/admin-session.service';
import { AdminMfaEnrollPage } from './admin-mfa-enroll-page';

const ADMIN = { id: 1, nombre: 'Ana', email: 'a@b.com', rol: 'ANALISTA' as const };
const ENROLL_RESPONSE = {
  mensaje: 'Escanea el código QR.',
  secreto: 'JBSWY3DPEHPK3PXP',
  otpauthUri: 'otpauth://totp/Prestamesta:a%40b.com?secret=JBSWY3DPEHPK3PXP',
};

describe('AdminMfaEnrollPage', () => {
  let enroll: ReturnType<typeof vi.fn>;
  let confirmEnrollment: ReturnType<typeof vi.fn>;
  let mfaFlowStart: ReturnType<typeof vi.fn>;
  let mfaFlowClear: ReturnType<typeof vi.fn>;
  let sessionSet: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let setNoIndex: ReturnType<typeof vi.fn>;

  function configure(returnUrl: string | null = null) {
    enroll = vi.fn().mockReturnValue(of(ENROLL_RESPONSE));
    confirmEnrollment = vi.fn();
    mfaFlowStart = vi.fn();
    mfaFlowClear = vi.fn();
    sessionSet = vi.fn();
    setNoIndex = vi.fn();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminMfaEnrollPage],
      providers: [
        provideRouter([]),
        { provide: AdminMfaService, useValue: { enroll, confirmEnrollment } },
        {
          provide: AdminMfaFlowService,
          useValue: {
            preMfaToken: () => 'pre-mfa-token',
            start: mfaFlowStart,
            clear: mfaFlowClear,
          },
        },
        { provide: AdminSessionService, useValue: { set: sessionSet } },
        { provide: SeoService, useValue: { setNoIndex, updateMetadata: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
              queryParams: returnUrl ? { returnUrl } : {},
            },
          },
        },
      ],
    });

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  }

  function createInstance() {
    const fixture = TestBed.createComponent(AdminMfaEnrollPage);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => configure());

  it('marks the page noindex and starts enrollment on construction', () => {
    createInstance();
    expect(setNoIndex).toHaveBeenCalledOnce();
    expect(enroll).toHaveBeenCalledOnce();
  });

  it('renders the otpauthUri-bearing enrollment data once loaded (QR is generated locally, no network call besides enroll())', () => {
    const fixture = createInstance();
    expect(fixture.componentInstance.status()).toBe('ready');
    expect(fixture.componentInstance.enrollment()).toEqual(ENROLL_RESPONSE);
  });

  it('offers the manual key only because the contract returned `secreto`', () => {
    const fixture = createInstance();
    expect(fixture.nativeElement.textContent).toContain('JBSWY3DPEHPK3PXP');
  });

  it('shows a load error and allows retrying', () => {
    enroll.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('error');
    expect(enroll).toHaveBeenCalledOnce();

    enroll.mockReturnValue(of(ENROLL_RESPONSE));
    fixture.componentInstance.startEnrollment();
    expect(fixture.componentInstance.status()).toBe('ready');
  });

  it('redirects to /admin/mfa/verificar on a 409 MFA_CHALLENGE_REQUIRED (already enrolled elsewhere)', () => {
    enroll.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'x', codigo: 'MFA_CHALLENGE_REQUIRED' },
          }),
      ),
    );
    createInstance();

    expect(mfaFlowStart).toHaveBeenCalledWith('pre-mfa-token', 'MFA_CHALLENGE_REQUIRED');
    expect(navigate).toHaveBeenCalledWith(['/admin/mfa/verificar'], { queryParams: {} });
  });

  it('does not show a local error on TOKEN_EXPIRED — the interceptor already redirects', () => {
    enroll.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 401, error: { mensaje: 'x', codigo: 'TOKEN_EXPIRED' } }),
      ),
    );
    const fixture = createInstance();

    expect(fixture.componentInstance.status()).toBe('loading');
  });

  it('confirming with a valid code does NOT create a session immediately — it only holds token+admin+codes in memory', () => {
    const codes = Array.from({ length: 10 }, (_, i) => `CODE-${i}`);
    confirmEnrollment.mockReturnValue(
      of({ mensaje: 'ok', token: 'jwt', admin: ADMIN, codigosRecuperacion: codes }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });

    component.confirmEnrollment();

    expect(confirmEnrollment).toHaveBeenCalledWith('123456');
    expect(sessionSet).not.toHaveBeenCalled();
    expect(mfaFlowClear).not.toHaveBeenCalled();
    expect(component.pendingSession()).toEqual({ token: 'jwt', admin: ADMIN });
    expect(component.recoveryCodes()).toEqual(codes);
    // Does not navigate away until the admin explicitly confirms they saved the codes.
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing codigosRecuperacion field', { mensaje: 'ok', token: 'jwt', admin: ADMIN }],
    [
      'an empty codigosRecuperacion array',
      { mensaje: 'ok', token: 'jwt', admin: ADMIN, codigosRecuperacion: [] },
    ],
  ])(
    'treats a successful enroll/confirm response with %s as invalid — never creates a session, never navigates, never invents codes',
    (_label, response) => {
      confirmEnrollment.mockReturnValue(of(response));
      const fixture = createInstance();
      const component = fixture.componentInstance;
      component.form.setValue({ codigo: '123456' });

      component.confirmEnrollment();

      expect(sessionSet).not.toHaveBeenCalled();
      expect(mfaFlowClear).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(component.pendingSession()).toBeNull();
      expect(component.recoveryCodes()).toBeNull();
      expect(component.confirmErrorMessage()).toBe(
        'No se pudo confirmar el código. Inténtalo de nuevo.',
      );
    },
  );

  it('wipes any stray in-memory pendingSession/recoveryCodes if a later confirm attempt comes back invalid', () => {
    confirmEnrollment.mockReturnValueOnce(
      of({
        mensaje: 'ok',
        token: 'stale-jwt',
        admin: ADMIN,
        codigosRecuperacion: Array(10).fill('CODE'),
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });
    component.confirmEnrollment();
    expect(component.pendingSession()).not.toBeNull();

    confirmEnrollment.mockReturnValueOnce(of({ mensaje: 'ok', token: 'jwt', admin: ADMIN }));
    component.form.setValue({ codigo: '654321' });
    component.confirmEnrollment();

    expect(component.pendingSession()).toBeNull();
    expect(component.recoveryCodes()).toBeNull();
    expect(sessionSet).not.toHaveBeenCalled();
  });

  it('marking the checkbox alone (without pressing the final button) does not create a session', () => {
    confirmEnrollment.mockReturnValue(
      of({
        mensaje: 'ok',
        token: 'jwt',
        admin: ADMIN,
        codigosRecuperacion: Array(10).fill('CODE'),
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });
    component.confirmEnrollment();

    component.savedAcknowledged.set(true);

    expect(sessionSet).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('the final button creates the session, clears the MFA flow, and clears the pending codes from memory, only after the checkbox is checked', () => {
    const codes = Array.from({ length: 10 }, (_, i) => `CODE-${i}`);
    confirmEnrollment.mockReturnValue(
      of({ mensaje: 'ok', token: 'jwt', admin: ADMIN, codigosRecuperacion: codes }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });
    component.confirmEnrollment();

    component.finishEnrollment();
    expect(sessionSet).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();

    component.savedAcknowledged.set(true);
    component.finishEnrollment();

    expect(sessionSet).toHaveBeenCalledWith({ token: 'jwt', admin: ADMIN });
    expect(mfaFlowClear).toHaveBeenCalledOnce();
    expect(component.recoveryCodes()).toBeNull();
    expect(component.pendingSession()).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('abandoning the flow (never pressing the final button) never creates a session', () => {
    confirmEnrollment.mockReturnValue(
      of({
        mensaje: 'ok',
        token: 'jwt',
        admin: ADMIN,
        codigosRecuperacion: Array(10).fill('CODE'),
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });

    component.confirmEnrollment();
    component.savedAcknowledged.set(true);
    // The admin closes the tab / navigates away here — finishEnrollment() is simply never called.

    expect(sessionSet).not.toHaveBeenCalled();
    expect(mfaFlowClear).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('warns before unload while the recovery codes are pending, and does not once the flow is finished', () => {
    confirmEnrollment.mockReturnValue(
      of({
        mensaje: 'ok',
        token: 'jwt',
        admin: ADMIN,
        codigosRecuperacion: Array(10).fill('CODE'),
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    const event = { preventDefault: vi.fn(), returnValue: '' } as unknown as BeforeUnloadEvent;

    component.warnBeforeUnload(event);
    expect(event.preventDefault).not.toHaveBeenCalled();

    component.form.setValue({ codigo: '123456' });
    component.confirmEnrollment();
    component.warnBeforeUnload(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();

    component.savedAcknowledged.set(true);
    component.finishEnrollment();
    vi.mocked(event.preventDefault).mockClear();
    component.warnBeforeUnload(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('follows a safe returnUrl after the acknowledgement', () => {
    configure('/admin/creditos');
    confirmEnrollment.mockReturnValue(
      of({
        mensaje: 'ok',
        token: 'jwt',
        admin: ADMIN,
        codigosRecuperacion: Array(10).fill('CODE'),
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });
    component.confirmEnrollment();
    component.savedAcknowledged.set(true);

    component.finishEnrollment();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin/creditos');
  });

  it('ignores an external returnUrl (open-redirect guard) even on the MFA completion path', () => {
    configure('https://evil.example.com');
    confirmEnrollment.mockReturnValue(
      of({
        mensaje: 'ok',
        token: 'jwt',
        admin: ADMIN,
        codigosRecuperacion: Array(10).fill('CODE'),
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });
    component.confirmEnrollment();
    component.savedAcknowledged.set(true);

    component.finishEnrollment();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('never persists recovery codes to sessionStorage or localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    confirmEnrollment.mockReturnValue(
      of({
        mensaje: 'ok',
        token: 'jwt',
        admin: ADMIN,
        codigosRecuperacion: ['SECRET-CODE-1', 'SECRET-CODE-2'],
      }),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });

    component.confirmEnrollment();

    for (const call of setItemSpy.mock.calls) {
      expect(call[1]).not.toContain('SECRET-CODE');
    }
    setItemSpy.mockRestore();
  });

  it('rejects an invalid confirmation code and lets the admin retry (no double-submit)', () => {
    confirmEnrollment.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { mensaje: 'x', codigo: 'MFA_ENROLLMENT_INVALID' },
          }),
      ),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '000000' });

    component.confirmEnrollment();

    expect(component.confirmStatus()).toBe('idle');
    expect(component.confirmErrorMessage()).toContain('código');
    expect(sessionSet).not.toHaveBeenCalled();
  });

  it('shows a rate-limit message on MFA_RATE_LIMITED', () => {
    confirmEnrollment.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { mensaje: 'x', codigo: 'MFA_RATE_LIMITED' },
          }),
      ),
    );
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });

    component.confirmEnrollment();

    expect(component.confirmErrorMessage()).toContain('Demasiados intentos');
  });

  it('blocks a second confirm submission while one is already in flight', () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });

    component.confirmStatus.set('submitting');
    component.confirmEnrollment();

    expect(confirmEnrollment).not.toHaveBeenCalled();
  });

  it('rejects a code confirmation attempt with an invalid format before calling the backend', () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: 'abc' });

    component.confirmEnrollment();

    expect(confirmEnrollment).not.toHaveBeenCalled();
  });
});

describe('AdminMfaEnrollPage — /admin stays protected until the final button (real AdminSessionService)', () => {
  // This describe block uses the REAL AdminSessionService, which mirrors itself to
  // sessionStorage — a session persisted by one test would otherwise leak into the next test's
  // fresh service instance (it reads sessionStorage on construction) and falsify isAuthenticated().
  afterEach(() => {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  });

  it('adminAuthGuard still redirects to /admin/login after a successful enroll/confirm, before finishEnrollment()', () => {
    const confirmEnrollment = vi.fn().mockReturnValue(
      of({
        mensaje: 'ok',
        token: 'jwt',
        admin: ADMIN,
        codigosRecuperacion: Array(10).fill('CODE'),
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminMfaEnrollPage],
      providers: [
        provideRouter([]),
        {
          provide: AdminMfaService,
          useValue: { enroll: vi.fn().mockReturnValue(of(ENROLL_RESPONSE)), confirmEnrollment },
        },
        {
          provide: AdminMfaFlowService,
          useValue: { preMfaToken: () => 'pre-mfa-token', start: vi.fn(), clear: vi.fn() },
        },
        // Real AdminSessionService — not mocked — so isAuthenticated() reflects reality.
        { provide: SeoService, useValue: { setNoIndex: vi.fn(), updateMetadata: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}), queryParams: {} } },
        },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    const sessionService = TestBed.inject(AdminSessionService);
    const fixture = TestBed.createComponent(AdminMfaEnrollPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });

    component.confirmEnrollment();

    // The token+admin+codes are held in memory only — no AdminSession exists yet.
    expect(sessionService.isAuthenticated()).toBe(false);
    const guardResult = TestBed.runInInjectionContext(() =>
      adminAuthGuard({} as never, { url: '/admin' } as never),
    );
    expect(guardResult).not.toBe(true);

    component.savedAcknowledged.set(true);
    component.finishEnrollment();

    // Only after the final button does a real session — and therefore guard access — exist.
    expect(sessionService.isAuthenticated()).toBe(true);
    expect(
      TestBed.runInInjectionContext(() => adminAuthGuard({} as never, { url: '/admin' } as never)),
    ).toBe(true);
  });

  it('an invalid enroll/confirm response (no recovery codes) never unlocks /admin', () => {
    const confirmEnrollment = vi
      .fn()
      .mockReturnValue(of({ mensaje: 'ok', token: 'jwt', admin: ADMIN }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AdminMfaEnrollPage],
      providers: [
        provideRouter([]),
        {
          provide: AdminMfaService,
          useValue: { enroll: vi.fn().mockReturnValue(of(ENROLL_RESPONSE)), confirmEnrollment },
        },
        {
          provide: AdminMfaFlowService,
          useValue: { preMfaToken: () => 'pre-mfa-token', start: vi.fn(), clear: vi.fn() },
        },
        { provide: SeoService, useValue: { setNoIndex: vi.fn(), updateMetadata: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}), queryParams: {} } },
        },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    const sessionService = TestBed.inject(AdminSessionService);
    const fixture = TestBed.createComponent(AdminMfaEnrollPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.form.setValue({ codigo: '123456' });

    component.confirmEnrollment();

    expect(sessionService.isAuthenticated()).toBe(false);
    expect(
      TestBed.runInInjectionContext(() => adminAuthGuard({} as never, { url: '/admin' } as never)),
    ).not.toBe(true);
  });
});

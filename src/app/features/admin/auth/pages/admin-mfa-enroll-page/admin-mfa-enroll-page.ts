import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import QRCode from 'qrcode';
import { ApiErrorCode, isApiErrorEnvelope } from '../../../../../core/api/api-error.model';
import { SeoService } from '../../../../../core/services/seo.service';
import {
  AdminMfaEnrollResponse,
  parseAdminMfaEnrollConfirmSession,
} from '../../models/admin-mfa.model';
import { AdminSession } from '../../models/admin-session.model';
import { AdminMfaFlowService } from '../../services/admin-mfa-flow.service';
import { AdminMfaService } from '../../services/admin-mfa.service';
import { AdminSessionService } from '../../services/admin-session.service';
import { resolveSafeAdminReturnUrl } from '../../utils/safe-admin-return-url';

type EnrollStatus = 'loading' | 'error' | 'ready';
type ConfirmStatus = 'idle' | 'submitting';

const CODE_PATTERN = /^\d{6}$/;
const LOAD_ERROR_MESSAGE = 'No se pudo iniciar la verificación en dos pasos. Inténtalo de nuevo.';
const GENERIC_CONFIRM_ERROR = 'No se pudo confirmar el código. Inténtalo de nuevo.';
const INVALID_CODE_ERROR =
  'El código no es válido o ya fue utilizado. Genera uno nuevo desde tu aplicación autenticadora e inténtalo de nuevo.';
const RATE_LIMITED_ERROR = 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';

/**
 * `/admin/mfa/enrolar` — Checkpoint 6C. Starts TOTP enrollment (POST .../mfa/enroll), renders the
 * QR entirely client-side from the returned `otpauthUri` (no external QR web service), confirms
 * the first code (POST .../mfa/enroll/confirm), and shows the one-time recovery codes batch
 * before letting the admin continue into the panel. Reachable only via `adminMfaStepGuard`.
 *
 * Hotfix (post-6C): a successful enroll/confirm does NOT create the AdminSession right away —
 * `token`/`admin` sit in `pendingSession` (component memory only) alongside the recovery codes
 * until the admin explicitly checks "ya guardé mis códigos" and presses the final button. Until
 * then `/admin` stays protected (no AdminSession exists yet), and abandoning or reloading the
 * page loses the pending token/codes entirely — by design, never persisted anywhere as a
 * workaround.
 */
@Component({
  selector: 'app-admin-mfa-enroll-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-mfa-enroll-page.html',
})
export class AdminMfaEnrollPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly mfaService = inject(AdminMfaService);
  private readonly mfaFlow = inject(AdminMfaFlowService);
  private readonly sessionService = inject(AdminSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly status = signal<EnrollStatus>('loading');
  readonly loadErrorMessage = signal('');
  readonly enrollment = signal<AdminMfaEnrollResponse | null>(null);
  readonly qrRenderFailed = signal(false);

  readonly confirmStatus = signal<ConfirmStatus>('idle');
  readonly confirmErrorMessage = signal('');

  // In-memory only, on purpose — never written to sessionStorage/localStorage, never logged.
  // See the component-level requirement: shown exactly once, gone on refresh or navigation.
  // `pendingSession` holds the token+admin from enroll/confirm until the final button is
  // pressed — AdminSessionService.set() must not run before that, or /admin would be reachable
  // without ever acknowledging the recovery codes.
  readonly pendingSession = signal<AdminSession | null>(null);
  readonly recoveryCodes = signal<readonly string[] | null>(null);
  readonly savedAcknowledged = signal(false);
  readonly copyFeedback = signal('');

  readonly form = this.formBuilder.group({
    codigo: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
  });

  private readonly qrCanvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');
  private readonly recoveryPanel = viewChild<ElementRef<HTMLElement>>('recoveryPanel');

  constructor() {
    inject(SeoService).setNoIndex();
    this.startEnrollment();

    effect(() => {
      const uri = this.enrollment()?.otpauthUri;
      const canvas = this.qrCanvas()?.nativeElement;
      // This route is RenderMode.Client (never rendered server-side), so `isBrowser` is always
      // true here in practice — guarded anyway for the same defense-in-depth reason AdminShell
      // guards its own router-driven side effects despite living in the same client-only subtree.
      if (!this.isBrowser || !uri || !canvas) {
        return;
      }
      QRCode.toCanvas(canvas, uri, { width: 220, margin: 1 }).catch(() => {
        this.qrRenderFailed.set(true);
      });
    });

    effect(() => {
      if (this.recoveryCodes() !== null) {
        this.recoveryPanel()?.nativeElement.focus();
      }
    });
  }

  startEnrollment(): void {
    this.status.set('loading');
    this.loadErrorMessage.set('');

    this.mfaService.enroll().subscribe({
      next: (response) => {
        this.enrollment.set(response);
        this.status.set('ready');
      },
      error: (error: unknown) => {
        const codigo = this.errorCode(error);

        // A 409 here means the account's MFA is already ACTIVO — login should have sent us to
        // /admin/mfa/verificar instead, but if that state changed out from under us (e.g.
        // enrolled from another tab) follow the backend's lead instead of getting stuck.
        if (codigo === 'MFA_CHALLENGE_REQUIRED') {
          const token = this.mfaFlow.preMfaToken();
          if (token) {
            this.mfaFlow.start(token, 'MFA_CHALLENGE_REQUIRED');
          }
          void this.router.navigate(['/admin/mfa/verificar'], {
            queryParams: this.route.snapshot.queryParams,
          });
          return;
        }

        if (this.isTokenError(codigo)) {
          // The interceptor already cleared the flow and is redirecting to /admin/login.
          return;
        }

        this.status.set('error');
        this.loadErrorMessage.set(LOAD_ERROR_MESSAGE);
      },
    });
  }

  confirmEnrollment(): void {
    if (this.confirmStatus() === 'submitting') {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.confirmStatus.set('submitting');
    this.confirmErrorMessage.set('');

    const codigo = this.form.getRawValue().codigo;

    this.mfaService.confirmEnrollment(codigo).subscribe({
      next: (response) => {
        this.confirmStatus.set('idle');

        // A first enrollment REQUIRES a non-empty codigosRecuperacion batch — there is no valid
        // "no codes" case here, and codes are never invented client-side. Any response missing
        // them is treated as invalid: no session, no navigation, any stray in-memory token from
        // an earlier attempt is wiped, and the admin has to log in again.
        const parsed = parseAdminMfaEnrollConfirmSession(response);
        if (!parsed) {
          this.pendingSession.set(null);
          this.recoveryCodes.set(null);
          this.form.controls.codigo.reset('');
          this.confirmErrorMessage.set(GENERIC_CONFIRM_ERROR);
          return;
        }

        // Do NOT create the session yet — hold it in memory until the admin explicitly
        // acknowledges saving the codes and presses the final button (finishEnrollment()).
        this.pendingSession.set({ token: parsed.token, admin: parsed.admin });
        this.recoveryCodes.set(parsed.codigosRecuperacion);
      },
      error: (error: unknown) => {
        this.confirmStatus.set('idle');
        const codigo = this.errorCode(error);

        if (this.isTokenError(codigo)) {
          return;
        }

        this.form.controls.codigo.reset('');
        this.confirmErrorMessage.set(this.mapConfirmError(error, codigo));
      },
    });
  }

  async copyRecoveryCodes(): Promise<void> {
    const codes = this.recoveryCodes();
    if (!codes) {
      return;
    }
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      this.copyFeedback.set('Códigos copiados al portapapeles.');
    } catch {
      this.copyFeedback.set('No se pudieron copiar automáticamente. Cópialos manualmente.');
    }
  }

  finishEnrollment(): void {
    const session = this.pendingSession();
    if (!this.savedAcknowledged() || !session) {
      return;
    }
    this.completeSession(session);
  }

  /** Warns before the tab closes/reloads while the token and recovery codes only exist in
   * memory — losing them means starting the MFA flow over, with no way to see the codes again. */
  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.recoveryCodes() !== null) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  /** Called by `adminMfaEnrollDeactivateGuard` once the admin confirms leaving while recovery
   * codes are still pending — drops the in-memory token/codes without ever creating a session. */
  abandonEnrollment(): void {
    this.pendingSession.set(null);
    this.recoveryCodes.set(null);
  }

  private completeSession(session: AdminSession): void {
    this.sessionService.set(session);
    this.mfaFlow.clear();
    // Nothing pending is left to protect or show once the session is real.
    this.pendingSession.set(null);
    this.recoveryCodes.set(null);
    this.goToReturnUrl();
  }

  private goToReturnUrl(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigateByUrl(resolveSafeAdminReturnUrl(returnUrl));
  }

  private mapConfirmError(error: unknown, codigo: ApiErrorCode | undefined): string {
    if (codigo === 'MFA_RATE_LIMITED') {
      return RATE_LIMITED_ERROR;
    }
    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
      return INVALID_CODE_ERROR;
    }
    return GENERIC_CONFIRM_ERROR;
  }

  private errorCode(error: unknown): ApiErrorCode | undefined {
    return error instanceof HttpErrorResponse && isApiErrorEnvelope(error.error)
      ? error.error.codigo
      : undefined;
  }

  private isTokenError(codigo: ApiErrorCode | undefined): boolean {
    return codigo === 'TOKEN_EXPIRED' || codigo === 'TOKEN_INVALID';
  }
}

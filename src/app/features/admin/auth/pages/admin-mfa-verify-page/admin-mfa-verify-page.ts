import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiErrorCode, isApiErrorEnvelope } from '../../../../../core/api/api-error.model';
import { SeoService } from '../../../../../core/services/seo.service';
import { parseAdminSession } from '../../models/admin-session.model';
import { AdminMfaFlowService } from '../../services/admin-mfa-flow.service';
import { AdminMfaService } from '../../services/admin-mfa.service';
import { AdminSessionService } from '../../services/admin-session.service';
import { resolveSafeAdminReturnUrl } from '../../utils/safe-admin-return-url';

type VerifyMethod = 'totp' | 'recovery';
type SubmitStatus = 'idle' | 'submitting';

const CODE_PATTERN = /^\d{6}$/;
const GENERIC_ERROR = 'No se pudo completar la verificación. Inténtalo de nuevo.';

/**
 * `/admin/mfa/verificar` — Checkpoint 6C. Completes login for an account that already has MFA
 * ACTIVO, via exactly one of a TOTP code or a recovery code (never both, per MfaVerifyInput in
 * openapi.yaml). Reachable only via `adminMfaStepGuard`.
 */
@Component({
  selector: 'app-admin-mfa-verify-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-mfa-verify-page.html',
})
export class AdminMfaVerifyPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly mfaService = inject(AdminMfaService);
  private readonly mfaFlow = inject(AdminMfaFlowService);
  private readonly sessionService = inject(AdminSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly method = signal<VerifyMethod>('totp');
  readonly status = signal<SubmitStatus>('idle');
  readonly errorMessage = signal('');

  readonly totpForm = this.formBuilder.group({
    codigo: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
  });
  readonly recoveryForm = this.formBuilder.group({
    codigoRecuperacion: ['', [Validators.required]],
  });

  constructor() {
    inject(SeoService).setNoIndex();
  }

  selectMethod(method: VerifyMethod): void {
    if (this.status() === 'submitting') {
      return;
    }
    this.method.set(method);
    this.errorMessage.set('');
  }

  submit(): void {
    if (this.status() === 'submitting') {
      return;
    }

    const usingTotp = this.method() === 'totp';
    const activeForm = usingTotp ? this.totpForm : this.recoveryForm;

    if (activeForm.invalid) {
      activeForm.markAllAsTouched();
      return;
    }

    this.status.set('submitting');
    this.errorMessage.set('');

    const request$ = usingTotp
      ? this.mfaService.verifyWithTotp(this.totpForm.getRawValue().codigo)
      : this.mfaService.verifyWithRecoveryCode(this.recoveryForm.getRawValue().codigoRecuperacion);

    request$.subscribe({
      next: (response) => {
        this.status.set('idle');

        const session = parseAdminSession(response);
        if (!session) {
          this.errorMessage.set(GENERIC_ERROR);
          return;
        }

        this.sessionService.set(session);
        this.mfaFlow.clear();

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(resolveSafeAdminReturnUrl(returnUrl));
      },
      error: (error: unknown) => {
        this.status.set('idle');
        const codigo = this.errorCode(error);

        if (this.isTokenError(codigo)) {
          // The interceptor already cleared the flow and is redirecting to /admin/login.
          return;
        }

        // The account's MFA turned out not to be ACTIVO after all (e.g. a reset out-of-band) —
        // follow the backend's lead to the enrollment step instead of looping on a 409 here.
        if (codigo === 'MFA_ENROLLMENT_REQUIRED') {
          const token = this.mfaFlow.preMfaToken();
          if (token) {
            this.mfaFlow.start(token, 'MFA_ENROLLMENT_REQUIRED');
          }
          void this.router.navigate(['/admin/mfa/enrolar'], {
            queryParams: this.route.snapshot.queryParams,
          });
          return;
        }

        activeForm.reset();
        this.errorMessage.set(this.mapVerifyError(codigo));
      },
    });
  }

  private mapVerifyError(codigo: ApiErrorCode | undefined): string {
    switch (codigo) {
      case 'MFA_INVALID_CODE':
        return 'El código ingresado no es válido.';
      case 'MFA_CODE_REUSED':
        return 'Ese código ya fue utilizado. Espera al siguiente código de tu aplicación autenticadora.';
      case 'RECOVERY_CODE_ALREADY_USED':
        return 'Ese código de recuperación ya fue utilizado.';
      case 'MFA_RATE_LIMITED':
        return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
      default:
        return GENERIC_ERROR;
    }
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

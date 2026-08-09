import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '../../../../../core/services/seo.service';
import { AdminAuthService } from '../../services/admin-auth.service';
import { emailFormatValidator, normalizeEmail } from '../../validators/email.validator';

type LoginStatus = 'idle' | 'submitting';

const MAX_EMAIL_LENGTH = 254;
const GENERIC_ERROR = 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.';
const INVALID_CREDENTIALS_ERROR = 'Correo o contraseña incorrectos.';

/**
 * Checkpoint 6C — mandatory MFA: a correct password no longer creates a session by itself. It
 * only starts the MFA flow (see AdminAuthService.login / AdminMfaFlowService); this page routes
 * to `/admin/mfa/enrolar` or `/admin/mfa/verificar` based on `siguientePaso`, forwarding
 * `returnUrl` as a query param so the MFA pages can resolve it safely once the real session
 * exists.
 */
@Component({
  selector: 'app-admin-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-login-page.html',
})
export class AdminLoginPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Public (not `protected`) so component tests can drive form state and assert on status
  // directly, matching the convention used by LaunchNotificationForm.
  readonly status = signal<LoginStatus>('idle');
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.group({
    email: [
      '',
      [Validators.required, Validators.maxLength(MAX_EMAIL_LENGTH), emailFormatValidator],
    ],
    password: ['', [Validators.required]],
  });

  constructor() {
    // Never indexed — same reasoning as the admin shell, and now also true for the MFA pages.
    inject(SeoService).setNoIndex();
  }

  onSubmit(): void {
    if (this.status() === 'submitting') {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('submitting');
    this.errorMessage.set('');

    const { email, password } = this.form.getRawValue();

    this.adminAuth.login(normalizeEmail(email), password).subscribe({
      next: (response) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const nextPath =
          response.siguientePaso === 'MFA_ENROLLMENT_REQUIRED'
            ? '/admin/mfa/enrolar'
            : '/admin/mfa/verificar';
        void this.router.navigate([nextPath], returnUrl ? { queryParams: { returnUrl } } : {});
      },
      error: (error: unknown) => {
        this.status.set('idle');
        this.errorMessage.set(
          error instanceof HttpErrorResponse && error.status === 401
            ? INVALID_CREDENTIALS_ERROR
            : GENERIC_ERROR,
        );
      },
    });
  }
}

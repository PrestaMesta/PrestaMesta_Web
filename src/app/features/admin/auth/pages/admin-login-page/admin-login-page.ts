import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { emailFormatValidator, normalizeEmail } from '../../validators/email.validator';

type LoginStatus = 'idle' | 'submitting';

const MAX_EMAIL_LENGTH = 254;
const GENERIC_ERROR = 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.';
const INVALID_CREDENTIALS_ERROR = 'Correo o contraseña incorrectos.';

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
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        // Only ever follow a returnUrl back into /admin — never an attacker-supplied external
        // redirect, even though today it can only come from our own guard. Also excludes
        // /admin/login itself: a crafted `?returnUrl=/admin/login` would otherwise bounce a
        // freshly authenticated admin straight back to the login page instead of the dashboard.
        const isSafeReturnUrl =
          !!returnUrl && returnUrl.startsWith('/admin') && !returnUrl.startsWith('/admin/login');
        void this.router.navigateByUrl(isSafeReturnUrl ? returnUrl : '/admin');
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

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminRole } from '../../../auth/models/admin-session.model';
import { emailFormatValidator, normalizeEmail } from '../../../auth/validators/email.validator';
import { ADMIN_ROLE_OPTIONS, CrearAdministradorInput } from '../../models/administrador.model';
import { AdministradorService } from '../../services/administrador.service';
import { passwordPolicyValidator } from '../../validators/administrador-form.validators';

type FormStatus = 'idle' | 'submitting';

// crearAdministradorSchema (adminAuthValidators.js): nombre max 150, email max 190 (narrower than
// the 254 used elsewhere for login — this endpoint's own schema caps it at 190).
const NOMBRE_MAX_LENGTH = 150;
const EMAIL_MAX_LENGTH = 190;

const GENERIC_VALIDATION_ERROR =
  'Los datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.';
const FORBIDDEN_ERROR = 'No tienes permiso para crear administradores.';
const EMAIL_ALREADY_EXISTS_ERROR = 'Ese correo ya está registrado para un administrador.';
const GENERIC_CREATE_ERROR = 'No se pudo crear el administrador. Inténtalo de nuevo.';

/**
 * POST /admin/administradores requires SUPERADMIN, enforced server-side (autorizarRoles,
 * re-checked from DB) — `adminSuperadminGuard` already keeps this route SUPERADMIN-only, and
 * `AdminShell`'s nav already hides the "Administradores" link from ANALISTA/COBRADOR (both from an
 * earlier checkpoint). This is the only administradores endpoint the backend implements: there is
 * no list, edit, delete, activate, or deactivate route, so none of those are offered here — this
 * page is a creation form and nothing else.
 */
@Component({
  selector: 'app-admin-administrators-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-administrators-page.html',
})
export class AdminAdministratorsPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly administradorService = inject(AdministradorService);

  readonly roleOptions = ADMIN_ROLE_OPTIONS;

  readonly formStatus = signal<FormStatus>('idle');
  readonly formErrorMessage = signal('');
  readonly formSuccessMessage = signal('');
  readonly pendingSubmission = signal<CrearAdministradorInput | null>(null);

  readonly form = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.maxLength(NOMBRE_MAX_LENGTH)]],
    email: [
      '',
      [Validators.required, Validators.maxLength(EMAIL_MAX_LENGTH), emailFormatValidator],
    ],
    password: ['', [Validators.required, passwordPolicyValidator]],
    rol: this.formBuilder.control<'' | AdminRole>('', Validators.required),
  });

  requestConfirmation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');

    const raw = this.form.getRawValue();
    this.pendingSubmission.set({
      nombre: raw.nombre.trim(),
      email: normalizeEmail(raw.email),
      password: raw.password,
      rol: raw.rol as AdminRole,
    });
  }

  cancelConfirmation(): void {
    this.pendingSubmission.set(null);
  }

  confirmCreate(): void {
    const input = this.pendingSubmission();
    if (!input || this.formStatus() === 'submitting') {
      return;
    }

    this.formStatus.set('submitting');
    this.formErrorMessage.set('');

    this.administradorService.create(input).subscribe({
      next: (response) => {
        this.formStatus.set('idle');
        this.pendingSubmission.set(null);
        this.formSuccessMessage.set(
          `${response.mensaje} (ID ${response.adminId}, rol ${response.rol}).`,
        );
        this.form.reset({ nombre: '', email: '', password: '', rol: '' });
      },
      error: (error: unknown) => {
        this.formStatus.set('idle');
        this.pendingSubmission.set(null);
        this.formErrorMessage.set(this.mapCreateError(error));
      },
    });
  }

  private mapCreateError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) {
        return GENERIC_VALIDATION_ERROR;
      }
      if (error.status === 403) {
        return FORBIDDEN_ERROR;
      }
      if (error.status === 409) {
        return EMAIL_ALREADY_EXISTS_ERROR;
      }
    }
    return GENERIC_CREATE_ERROR;
  }
}

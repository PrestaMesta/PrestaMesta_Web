import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../../shared/components/icon/icon';
import { AdminSessionService } from '../../../auth/services/admin-session.service';
import { Credito } from '../../models/credito.model';
import { CreditoService } from '../../services/credito.service';
import {
  INTEGER_PLAZO_PATTERN,
  decimalValidator,
  montoRangeValidator,
  positiveDecimalValidator,
} from '../../validators/credito-form.validators';

type LoadStatus = 'loading' | 'success' | 'error';
type FormStatus = 'idle' | 'submitting';

// monto_minimo/monto_maximo are DECIMAL(12,2); tasa_interes_anual is DECIMAL(5,2) — see
// migrations/003_creditos.sql on the backend.
const MONTO_MAX_INTEGER_DIGITS = 10;
const TASA_MAX_INTEGER_DIGITS = 3;
const NOMBRE_MAX_LENGTH = 150;

const GENERIC_LOAD_ERROR = 'No se pudo cargar el catálogo de créditos. Inténtalo de nuevo.';
const GENERIC_CREATE_ERROR = 'No se pudo crear el crédito. Inténtalo de nuevo.';
const FORBIDDEN_CREATE_ERROR = 'No tienes permiso para crear créditos.';

/**
 * GET /prestamos/creditos has no role restriction, so every admin role can view this page and its
 * list. POST /prestamos/creditos is SUPERADMIN/ANALISTA-only server-side (autorizarRoles); this
 * component mirrors that by never rendering the create form at all for COBRADOR, rather than
 * merely disabling it — defense in depth, not the source of truth.
 */
@Component({
  selector: 'app-admin-credits-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, EmptyState, Icon],
  templateUrl: './admin-credits-page.html',
})
export class AdminCreditsPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly creditoService = inject(CreditoService);
  private readonly session = inject(AdminSessionService);

  readonly status = signal<LoadStatus>('loading');
  readonly credits = signal<readonly Credito[]>([]);
  readonly loadErrorMessage = signal('');

  readonly canCreate = computed(() => {
    const rol = this.session.admin()?.rol;
    return rol === 'SUPERADMIN' || rol === 'ANALISTA';
  });

  readonly formStatus = signal<FormStatus>('idle');
  readonly formErrorMessage = signal('');
  readonly formSuccessMessage = signal('');

  readonly form = this.formBuilder.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(NOMBRE_MAX_LENGTH)]],
      monto_minimo: [
        '',
        [
          Validators.required,
          decimalValidator(MONTO_MAX_INTEGER_DIGITS),
          positiveDecimalValidator(MONTO_MAX_INTEGER_DIGITS),
        ],
      ],
      monto_maximo: [
        '',
        [
          Validators.required,
          decimalValidator(MONTO_MAX_INTEGER_DIGITS),
          positiveDecimalValidator(MONTO_MAX_INTEGER_DIGITS),
        ],
      ],
      tasa_interes_anual: ['', [Validators.required, decimalValidator(TASA_MAX_INTEGER_DIGITS)]],
      plazo_meses: ['', [Validators.required, Validators.pattern(INTEGER_PLAZO_PATTERN)]],
    },
    { validators: montoRangeValidator },
  );

  constructor() {
    this.load();
  }

  refresh(): void {
    this.load();
  }

  onSubmit(): void {
    if (!this.canCreate() || this.formStatus() === 'submitting') {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formStatus.set('submitting');
    this.formErrorMessage.set('');
    this.formSuccessMessage.set('');

    this.creditoService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.formStatus.set('idle');
        this.formSuccessMessage.set('Crédito creado con éxito.');
        this.form.reset();
        this.load();
      },
      error: (error: unknown) => {
        this.formStatus.set('idle');
        this.formErrorMessage.set(
          error instanceof HttpErrorResponse && error.status === 403
            ? FORBIDDEN_CREATE_ERROR
            : GENERIC_CREATE_ERROR,
        );
      },
    });
  }

  private load(): void {
    this.status.set('loading');
    this.loadErrorMessage.set('');

    this.creditoService.list().subscribe({
      next: (credits) => {
        this.credits.set(credits);
        this.status.set('success');
      },
      error: () => {
        this.status.set('error');
        this.loadErrorMessage.set(GENERIC_LOAD_ERROR);
      },
    });
  }
}

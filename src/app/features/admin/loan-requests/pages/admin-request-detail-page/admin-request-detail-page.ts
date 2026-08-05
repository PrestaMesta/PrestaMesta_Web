import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminSessionService } from '../../../auth/services/admin-session.service';
import { CambiarEstadoAccion, PrestamoAdminDetalle } from '../../models/prestamo-admin.model';
import { PrestamoAdminService } from '../../services/prestamo-admin.service';

type LoadStatus = 'loading' | 'success' | 'notFound' | 'error';
type ActionStatus = 'idle' | 'submitting';

const MOTIVO_MAX_LENGTH = 500;

const GENERIC_LOAD_ERROR = 'No se pudo cargar la solicitud. Inténtalo de nuevo.';
const FORBIDDEN_LOAD_ERROR = 'No tienes permiso para consultar esta solicitud.';
const NOT_FOUND_ERROR = 'Esta solicitud no existe.';
const GENERIC_ACTION_ERROR = 'No se pudo actualizar la solicitud. Inténtalo de nuevo.';
const FORBIDDEN_ACTION_ERROR = 'No tienes permiso para esta acción.';
const INVALID_TRANSITION_ERROR = 'Esta solicitud ya no está pendiente de revisión.';
const NOT_FOUND_ACTION_ERROR = 'Esta solicitud ya no existe.';

/**
 * GET /admin/prestamos/:id requires SUPERADMIN/ANALISTA (same guard as the list page); PATCH
 * /prestamos/:id/estado requires the same two roles, re-checked server-side on every request
 * (autorizarRoles, re-reads the role from DB) — the atomic `SELECT ... FOR UPDATE` transaction
 * there is the actual source of truth for "still PENDIENTE", not this component. `canDecide` and
 * the PENDIENTE check here only avoid showing a control that would just 403/409, never assume
 * the click will succeed.
 */
@Component({
  selector: 'app-admin-request-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-request-detail-page.html',
})
export class AdminRequestDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly prestamoAdminService = inject(PrestamoAdminService);
  private readonly session = inject(AdminSessionService);

  private readonly prestamoId: number;

  readonly status = signal<LoadStatus>('loading');
  readonly prestamo = signal<PrestamoAdminDetalle | null>(null);
  readonly loadErrorMessage = signal('');

  readonly canDecide = computed(() => {
    const rol = this.session.admin()?.rol;
    return rol === 'SUPERADMIN' || rol === 'ANALISTA';
  });

  readonly pendingAction = signal<CambiarEstadoAccion | null>(null);
  readonly actionStatus = signal<ActionStatus>('idle');
  readonly actionErrorMessage = signal('');
  readonly actionSuccessMessage = signal('');

  readonly motivoForm = this.formBuilder.group({
    motivo: ['', [Validators.maxLength(MOTIVO_MAX_LENGTH)]],
  });

  private readonly confirmPanel = viewChild<ElementRef<HTMLElement>>('confirmPanel');

  constructor() {
    // Opening the confirmation panel introduces new interactive controls (Confirmar/Cancelar);
    // moving focus into it is the same expectation as opening a modal, so keyboard/screen-reader
    // users aren't left on a button that's still there but no longer does what it did a moment ago.
    effect(() => {
      if (this.pendingAction() !== null) {
        this.confirmPanel()?.nativeElement.focus();
      }
    });

    const rawId = this.route.snapshot.paramMap.get('id');
    const parsedId = Number(rawId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      this.prestamoId = Number.NaN;
      this.status.set('notFound');
      this.loadErrorMessage.set(NOT_FOUND_ERROR);
      return;
    }

    this.prestamoId = parsedId;
    this.load();
  }

  refresh(): void {
    this.load();
  }

  startAction(accion: CambiarEstadoAccion): void {
    this.pendingAction.set(accion);
    this.actionErrorMessage.set('');
    this.actionSuccessMessage.set('');
    this.motivoForm.reset({ motivo: '' });
  }

  cancelAction(): void {
    this.pendingAction.set(null);
  }

  confirmAction(): void {
    const accion = this.pendingAction();
    if (!accion || this.actionStatus() === 'submitting') {
      return;
    }

    if (this.motivoForm.invalid) {
      this.motivoForm.markAllAsTouched();
      return;
    }

    this.actionStatus.set('submitting');
    this.actionErrorMessage.set('');

    const motivo = this.motivoForm.getRawValue().motivo.trim();

    this.prestamoAdminService
      .cambiarEstado(this.prestamoId, { estado: accion, motivo: motivo || undefined })
      .subscribe({
        next: (response) => {
          this.actionStatus.set('idle');
          this.pendingAction.set(null);
          this.actionSuccessMessage.set(response.mensaje);
          this.load();
        },
        error: (error: unknown) => {
          this.actionStatus.set('idle');
          this.actionErrorMessage.set(this.mapActionError(error));

          // The loan was already resolved by someone else (or another tab) between opening the
          // confirmation panel and confirming — reload so the UI reflects reality instead of
          // still offering a decision that the backend has already made moot.
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.pendingAction.set(null);
            this.load();
          }
        },
      });
  }

  private mapActionError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return FORBIDDEN_ACTION_ERROR;
      }
      if (error.status === 404) {
        return NOT_FOUND_ACTION_ERROR;
      }
      if (error.status === 409) {
        return INVALID_TRANSITION_ERROR;
      }
    }
    return GENERIC_ACTION_ERROR;
  }

  private load(): void {
    this.status.set('loading');
    this.loadErrorMessage.set('');

    this.prestamoAdminService.getById(this.prestamoId).subscribe({
      next: (detalle) => {
        this.prestamo.set(detalle);
        this.status.set('success');
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.status.set('notFound');
          this.loadErrorMessage.set(NOT_FOUND_ERROR);
          return;
        }
        this.status.set('error');
        this.loadErrorMessage.set(
          error instanceof HttpErrorResponse && error.status === 403
            ? FORBIDDEN_LOAD_ERROR
            : GENERIC_LOAD_ERROR,
        );
      },
    });
  }
}

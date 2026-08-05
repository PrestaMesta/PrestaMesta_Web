import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../../shared/components/icon/icon';
import {
  EstadoPrestamo,
  Pagination,
  PrestamoAdminFilters,
  PrestamoAdminListItem,
} from '../../models/prestamo-admin.model';
import { PrestamoAdminService } from '../../services/prestamo-admin.service';
import {
  POSITIVE_INTEGER_PATTERN,
  fechaRangeValidator,
} from '../../validators/prestamo-filters.validators';

type LoadStatus = 'loading' | 'success' | 'error';
type LoanRequestFilterValues = Omit<PrestamoAdminFilters, 'page' | 'limit'>;

const PAGE_SIZE = 20;
const GENERIC_LOAD_ERROR = 'No se pudo cargar el listado de solicitudes. Inténtalo de nuevo.';
const FORBIDDEN_LOAD_ERROR = 'No tienes permiso para consultar las solicitudes.';

/**
 * GET /admin/prestamos requires SUPERADMIN/ANALISTA server-side; `adminLoanAccessGuard` keeps
 * COBRADOR out of this route entirely, but the backend remains the authority (a 403 here is
 * handled gracefully rather than assumed impossible — e.g. a role changed mid-session).
 */
@Component({
  selector: 'app-admin-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, EmptyState, Icon],
  templateUrl: './admin-requests-page.html',
})
export class AdminRequestsPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly prestamoAdminService = inject(PrestamoAdminService);

  readonly status = signal<LoadStatus>('loading');
  readonly items = signal<readonly PrestamoAdminListItem[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly loadErrorMessage = signal('');
  readonly currentPage = signal(1);

  private appliedFilters: LoanRequestFilterValues = {};

  readonly filtersForm = this.formBuilder.group(
    {
      estado: this.formBuilder.control<'' | EstadoPrestamo>(''),
      cliente_id: ['', [Validators.pattern(POSITIVE_INTEGER_PATTERN)]],
      credito_id: ['', [Validators.pattern(POSITIVE_INTEGER_PATTERN)]],
      fecha_desde: [''],
      fecha_hasta: [''],
    },
    { validators: fechaRangeValidator },
  );

  constructor() {
    this.load();
  }

  refresh(): void {
    this.load();
  }

  applyFilters(): void {
    if (this.filtersForm.invalid) {
      this.filtersForm.markAllAsTouched();
      return;
    }

    const raw = this.filtersForm.getRawValue();
    this.appliedFilters = {
      estado: raw.estado || undefined,
      cliente_id: raw.cliente_id ? Number(raw.cliente_id) : undefined,
      credito_id: raw.credito_id ? Number(raw.credito_id) : undefined,
      fecha_desde: raw.fecha_desde || undefined,
      fecha_hasta: raw.fecha_hasta || undefined,
    };
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      estado: '',
      cliente_id: '',
      credito_id: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
    this.appliedFilters = {};
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number): void {
    const totalPages = this.pagination()?.totalPages ?? 1;
    if (page < 1 || page > totalPages || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.load();
  }

  estadoBadgeClasses(estado: EstadoPrestamo): string {
    switch (estado) {
      case 'APROBADO':
        return 'bg-emerald-50 text-emerald-800';
      case 'RECHAZADO':
        return 'bg-red-50 text-red-800';
      default:
        return 'bg-amber-50 text-amber-800';
    }
  }

  private load(): void {
    this.status.set('loading');
    this.loadErrorMessage.set('');

    this.prestamoAdminService
      .list({ page: this.currentPage(), limit: PAGE_SIZE, ...this.appliedFilters })
      .subscribe({
        next: (response) => {
          this.items.set(response.data);
          this.pagination.set(response.pagination);
          this.status.set('success');
        },
        error: (error: unknown) => {
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

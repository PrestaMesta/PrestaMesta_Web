import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_AUTH_REQUIRED } from '../../../../core/interceptors/admin-auth.context';
import {
  CambiarEstadoRequestBody,
  CambiarEstadoResponse,
  PrestamoAdminDetalle,
  PrestamoAdminFilters,
  PrestamoAdminListResponse,
} from '../models/prestamo-admin.model';

/**
 * GET /admin/prestamos and GET /admin/prestamos/:id require SUPERADMIN or ANALISTA
 * (adminPrestamoRoutes.js) — COBRADOR has no access at all to this feature, unlike the créditos
 * catalog where COBRADOR could read but not write. `AdminLoanAccessGuard` blocks COBRADOR at the
 * route level; this service does not re-check the role, the backend remains the authority.
 *
 * PATCH /prestamos/:id/estado lives under a different URL prefix (`/prestamos`, not
 * `/admin/prestamos` — see prestamoRoutes.js) even though it requires the same two roles; that
 * asymmetry is the real backend contract, not a typo here. All three calls are marked
 * `ADMIN_AUTH_REQUIRED` so `adminAuthInterceptor` attaches the admin Bearer token.
 */
@Injectable({ providedIn: 'root' })
export class PrestamoAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  list(filters: PrestamoAdminFilters): Observable<PrestamoAdminListResponse> {
    return this.http.get<PrestamoAdminListResponse>(`${this.apiConfig.baseUrl()}/admin/prestamos`, {
      params: this.buildListParams(filters),
      context: this.adminAuthContext(),
    });
  }

  getById(id: number): Observable<PrestamoAdminDetalle> {
    return this.http.get<PrestamoAdminDetalle>(
      `${this.apiConfig.baseUrl()}/admin/prestamos/${id}`,
      { context: this.adminAuthContext() },
    );
  }

  cambiarEstado(id: number, body: CambiarEstadoRequestBody): Observable<CambiarEstadoResponse> {
    return this.http.patch<CambiarEstadoResponse>(
      `${this.apiConfig.baseUrl()}/prestamos/${id}/estado`,
      body,
      { context: this.adminAuthContext() },
    );
  }

  // filtrosAdminPrestamoSchema is `.strict()` — only ever send keys the backend actually declares,
  // and only when the caller supplied a value, so an absent filter is simply omitted rather than
  // sent as an empty string (which would fail the backend's own type coercion).
  private buildListParams(filters: PrestamoAdminFilters): HttpParams {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('limit', String(filters.limit));

    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters.cliente_id !== undefined) {
      params = params.set('cliente_id', String(filters.cliente_id));
    }
    if (filters.credito_id !== undefined) {
      params = params.set('credito_id', String(filters.credito_id));
    }
    if (filters.fecha_desde) {
      params = params.set('fecha_desde', filters.fecha_desde);
    }
    if (filters.fecha_hasta) {
      params = params.set('fecha_hasta', filters.fecha_hasta);
    }

    return params;
  }

  private adminAuthContext(): HttpContext {
    return new HttpContext().set(ADMIN_AUTH_REQUIRED, true);
  }
}

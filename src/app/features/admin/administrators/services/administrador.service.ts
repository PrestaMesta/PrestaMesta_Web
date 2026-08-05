import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_AUTH_REQUIRED } from '../../../../core/interceptors/admin-auth.context';
import { CrearAdministradorInput, CrearAdministradorResponse } from '../models/administrador.model';

/**
 * POST /admin/administradores requires SUPERADMIN, re-checked server-side on every request
 * (autorizarRoles, role re-read from DB) — `adminSuperadminGuard` keeps other roles off this
 * route, but the backend remains the actual authority. This is the only administradores endpoint
 * that exists: no list, edit, delete, activate, or deactivate endpoint is implemented server-side
 * (see administradoresRoutes.js), so none of those are offered here either.
 */
@Injectable({ providedIn: 'root' })
export class AdministradorService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  create(input: CrearAdministradorInput): Observable<CrearAdministradorResponse> {
    return this.http.post<CrearAdministradorResponse>(
      `${this.apiConfig.baseUrl()}/admin/administradores`,
      input,
      { context: new HttpContext().set(ADMIN_AUTH_REQUIRED, true) },
    );
  }
}

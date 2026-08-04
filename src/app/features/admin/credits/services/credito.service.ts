import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_AUTH_REQUIRED } from '../../../../core/interceptors/admin-auth.context';
import { Credito, CreditoCreatedResponse, CreditoFormValue } from '../models/credito.model';
import { toCreditoCreateRequestBody } from './credito-request.mapper';

/**
 * GET /prestamos/creditos is readable by any authenticated admin role (client tokens too, but
 * this app only ever calls it with an admin session); POST requires SUPERADMIN or ANALISTA,
 * enforced server-side — this service does not duplicate that check, `AdminCreditsPage` decides
 * whether to even render the create form. Both calls are marked `ADMIN_AUTH_REQUIRED` so
 * `adminAuthInterceptor` attaches the admin Bearer token (see core/interceptors/admin-auth.context.ts) —
 * neither endpoint lives fully under `/admin`, so URL-based detection would not work here.
 *
 * `create()` is the HTTP boundary where `CreditoFormValue`'s decimal/integer strings become the
 * JSON numbers the API contract requires — see ./credito-request.mapper.ts. The GET response is
 * left untouched: monto/tasa arrive as strings (mysql2's DECIMAL representation) and stay strings.
 */
@Injectable({ providedIn: 'root' })
export class CreditoService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  list(): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.apiConfig.baseUrl()}/prestamos/creditos`, {
      context: this.adminAuthContext(),
    });
  }

  create(input: CreditoFormValue): Observable<CreditoCreatedResponse> {
    let body;
    try {
      body = toCreditoCreateRequestBody(input);
    } catch (error) {
      return throwError(() => error);
    }

    return this.http.post<CreditoCreatedResponse>(
      `${this.apiConfig.baseUrl()}/prestamos/creditos`,
      body,
      { context: this.adminAuthContext() },
    );
  }

  private adminAuthContext(): HttpContext {
    return new HttpContext().set(ADMIN_AUTH_REQUIRED, true);
  }
}

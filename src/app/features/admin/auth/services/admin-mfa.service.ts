import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { ADMIN_PRE_MFA_REQUIRED } from '../../../../core/interceptors/admin-pre-mfa.context';
import { AdminMfaEnrollResponse, AdminMfaSessionResponse } from '../models/admin-mfa.model';

/**
 * The three MFA-flow endpoints under /admin/auth/mfa/*. All three authenticate with the
 * short-lived preMfaToken (ADMIN_PRE_MFA_REQUIRED) — there is no full session yet at this point
 * in the flow, so none of these ever use ADMIN_AUTH_REQUIRED.
 */
@Injectable({ providedIn: 'root' })
export class AdminMfaService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  /** POST /admin/auth/mfa/enroll — no request body per openapi.yaml. */
  enroll(): Observable<AdminMfaEnrollResponse> {
    return this.http.post<AdminMfaEnrollResponse>(
      `${this.apiConfig.baseUrl()}/admin/auth/mfa/enroll`,
      null,
      { context: this.preMfaContext() },
    );
  }

  /** POST /admin/auth/mfa/enroll/confirm — body is exactly MfaEnrollConfirmInput. */
  confirmEnrollment(codigo: string): Observable<AdminMfaSessionResponse> {
    return this.http.post<AdminMfaSessionResponse>(
      `${this.apiConfig.baseUrl()}/admin/auth/mfa/enroll/confirm`,
      { codigo },
      { context: this.preMfaContext() },
    );
  }

  /** POST /admin/auth/mfa/verify with a TOTP code — body is exactly `{ codigo }`, never both fields. */
  verifyWithTotp(codigo: string): Observable<AdminMfaSessionResponse> {
    return this.http.post<AdminMfaSessionResponse>(
      `${this.apiConfig.baseUrl()}/admin/auth/mfa/verify`,
      { codigo },
      { context: this.preMfaContext() },
    );
  }

  /** POST /admin/auth/mfa/verify with a recovery code — body is exactly `{ codigoRecuperacion }`. */
  verifyWithRecoveryCode(codigoRecuperacion: string): Observable<AdminMfaSessionResponse> {
    return this.http.post<AdminMfaSessionResponse>(
      `${this.apiConfig.baseUrl()}/admin/auth/mfa/verify`,
      { codigoRecuperacion },
      { context: this.preMfaContext() },
    );
  }

  private preMfaContext(): HttpContext {
    return new HttpContext().set(ADMIN_PRE_MFA_REQUIRED, true);
  }
}

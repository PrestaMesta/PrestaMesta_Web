import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { AdminLoginPreMfaResponse } from '../models/admin-mfa.model';
import { AdminMfaFlowService } from './admin-mfa-flow.service';
import { AdminSessionService } from './admin-session.service';

/**
 * Talks to POST /admin/auth/login (public — no Authorization header, enforced by
 * `adminAuthInterceptor` since this request carries neither ADMIN_AUTH_REQUIRED nor
 * ADMIN_PRE_MFA_REQUIRED). Checkpoint 6C — mandatory MFA: login alone never yields a usable
 * session anymore. A correct password only starts the MFA flow (`preMfaToken` +
 * `siguientePaso`), persisted via AdminMfaFlowService. The real AdminSession is only ever
 * created after MFA completes (see AdminMfaService + the enroll/verify pages).
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly sessionService = inject(AdminSessionService);
  private readonly mfaFlow = inject(AdminMfaFlowService);

  login(email: string, password: string): Observable<AdminLoginPreMfaResponse> {
    const url = `${this.apiConfig.baseUrl()}/admin/auth/login`;
    return this.http.post<AdminLoginPreMfaResponse>(url, { email, password }).pipe(
      tap((response) => {
        this.mfaFlow.start(response.preMfaToken, response.siguientePaso);
      }),
    );
  }

  logout(): void {
    this.sessionService.clear();
    this.mfaFlow.clear();
  }
}

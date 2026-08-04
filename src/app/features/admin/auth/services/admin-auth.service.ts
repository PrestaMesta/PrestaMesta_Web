import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiConfigService } from '../../../../core/api/api-config.service';
import { AdminLoginResponse, AdminProfile } from '../models/admin-session.model';
import { AdminSessionService } from './admin-session.service';

/**
 * Talks to POST /admin/auth/login (public — no Authorization header, enforced by
 * `adminAuthInterceptor` recognizing this exact URL) and persists the resulting session.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly sessionService = inject(AdminSessionService);

  login(email: string, password: string): Observable<AdminProfile> {
    const url = `${this.apiConfig.baseUrl()}/admin/auth/login`;
    return this.http.post<AdminLoginResponse>(url, { email, password }).pipe(
      tap((response) => {
        this.sessionService.set({ token: response.token, admin: response.admin });
      }),
      map((response) => response.admin),
    );
  }

  logout(): void {
    this.sessionService.clear();
  }
}

import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SeoService } from '../../../../core/services/seo.service';
import { Icon, IconName } from '../../../../shared/components/icon/icon';
import { AdminRole } from '../../auth/models/admin-session.model';
import { AdminAuthService } from '../../auth/services/admin-auth.service';
import { AdminSessionService } from '../../auth/services/admin-session.service';

export interface AdminNavLink {
  readonly label: string;
  readonly path: string;
  readonly icon: IconName;
  /** Omitted entirely means every role can see this link. */
  readonly allowedRoles?: readonly AdminRole[];
}

/**
 * `allowedRoles` mirrors each route's actual backend authorization, not a UI guess:
 * - Créditos: GET /prestamos/creditos has no role restriction (see credito.service.ts).
 * - Solicitudes: GET /admin/prestamos requires SUPERADMIN/ANALISTA — COBRADOR has zero access
 *   (adminPrestamoRoutes.js), enforced client-side by `adminLoanAccessGuard`.
 * - Administradores: POST /admin/administradores requires SUPERADMIN only.
 */
export const ADMIN_NAV_LINKS: readonly AdminNavLink[] = [
  { label: 'Inicio', path: '/admin', icon: 'home' },
  { label: 'Créditos', path: '/admin/creditos', icon: 'credit-card' },
  {
    label: 'Solicitudes',
    path: '/admin/solicitudes',
    icon: 'file-check',
    allowedRoles: ['SUPERADMIN', 'ANALISTA'],
  },
  {
    label: 'Administradores',
    path: '/admin/administradores',
    icon: 'users',
    allowedRoles: ['SUPERADMIN'],
  },
];

/** Base layout for every authenticated `/admin/**` page: nav + admin identity + logout. */
@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  private readonly sessionService = inject(AdminSessionService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly admin = this.sessionService.admin;
  protected readonly navLinks = computed(() => {
    const rol = this.admin()?.rol;
    return ADMIN_NAV_LINKS.filter(
      (link) => !link.allowedRoles || (rol !== undefined && link.allowedRoles.includes(rol)),
    );
  });

  private readonly mainContent = viewChild<ElementRef<HTMLElement>>('mainContent');

  constructor() {
    // Session-gated dashboard: never indexed, regardless of render mode (see app.routes.server.ts).
    inject(SeoService).setNoIndex();

    // Moves focus to the main landmark on every route change within the admin shell, so keyboard
    // and screen-reader users land somewhere meaningful instead of on a nav link that may no
    // longer be there (e.g. after a role-gated redirect). Browser-only: there is no focus to move
    // during SSR, and this route subtree never actually renders server-side anyway.
    if (isPlatformBrowser(this.platformId)) {
      this.router.events
        .pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          takeUntilDestroyed(),
        )
        .subscribe(() => this.mainContent()?.nativeElement.focus());
    }
  }

  logout(): void {
    this.adminAuth.logout();
    void this.router.navigateByUrl('/admin/login');
  }
}

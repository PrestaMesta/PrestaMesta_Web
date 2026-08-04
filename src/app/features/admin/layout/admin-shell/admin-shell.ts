import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon, IconName } from '../../../../shared/components/icon/icon';
import { AdminRole } from '../../auth/models/admin-session.model';
import { AdminAuthService } from '../../auth/services/admin-auth.service';
import { AdminSessionService } from '../../auth/services/admin-session.service';

interface AdminNavLink {
  readonly label: string;
  readonly path: string;
  readonly icon: IconName;
  readonly requiredRole?: AdminRole;
}

const ADMIN_NAV_LINKS: readonly AdminNavLink[] = [
  { label: 'Inicio', path: '/admin', icon: 'home' },
  { label: 'Créditos', path: '/admin/creditos', icon: 'credit-card' },
  { label: 'Solicitudes', path: '/admin/solicitudes', icon: 'file-check' },
  {
    label: 'Administradores',
    path: '/admin/administradores',
    icon: 'users',
    requiredRole: 'SUPERADMIN',
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

  protected readonly admin = this.sessionService.admin;
  protected readonly navLinks = computed(() =>
    ADMIN_NAV_LINKS.filter((link) => !link.requiredRole || link.requiredRole === this.admin()?.rol),
  );

  logout(): void {
    this.adminAuth.logout();
    void this.router.navigateByUrl('/admin/login');
  }
}

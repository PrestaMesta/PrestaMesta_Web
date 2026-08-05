import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';
import { AdminSessionService } from '../../auth/services/admin-session.service';
import { ADMIN_NAV_LINKS } from '../../layout/admin-shell/admin-shell';

/**
 * Honest landing page: a greeting and links to the modules this admin's role can actually use —
 * reusing `ADMIN_NAV_LINKS` (the same source of truth `AdminShell`'s nav filters against) so the
 * two never drift apart. No metrics, counts, or summaries: none of those are backed by a real
 * endpoint, so none are invented here.
 */
@Component({
  selector: 'app-admin-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  templateUrl: './admin-home-page.html',
})
export class AdminHomePage {
  private readonly session = inject(AdminSessionService);

  protected readonly admin = this.session.admin;

  protected readonly quickLinks = computed(() => {
    const rol = this.admin()?.rol;
    return ADMIN_NAV_LINKS.filter(
      (link) =>
        link.path !== '/admin' &&
        (!link.allowedRoles || (rol !== undefined && link.allowedRoles.includes(rol))),
    );
  });
}

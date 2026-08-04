import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { AdminSessionService } from '../../auth/services/admin-session.service';

@Component({
  selector: 'app-admin-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  templateUrl: './admin-home-page.html',
})
export class AdminHomePage {
  protected readonly admin = inject(AdminSessionService).admin;
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-admin-administrators-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  templateUrl: './admin-administrators-page.html',
})
export class AdminAdministratorsPage {}

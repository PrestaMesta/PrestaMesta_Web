import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

/** Honest "not built yet" placeholder — no invented metrics, no fake sample data. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly icon = input<IconName>('file-check');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}

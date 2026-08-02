import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Names of the small, original stroke-icon set used across the site. `lucide-angular`'s current
 * release only declares peer support up to Angular 21, so rather than force-install a mismatched
 * peer dependency, this component hand-draws a focused subset of icons in the same 24x24
 * stroke-based style. See docs/decisions for the rationale.
 */
export type IconName =
  | 'menu'
  | 'close'
  | 'chevron-down'
  | 'download'
  | 'copy'
  | 'check'
  | 'check-circle'
  | 'shield-check'
  | 'smartphone'
  | 'clock'
  | 'lock'
  | 'file-check'
  | 'headset'
  | 'calendar'
  | 'alert-triangle'
  | 'external-link'
  | 'arrow-right'
  | 'mail'
  | 'search'
  | 'credit-card'
  | 'bell'
  | 'user';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);
}

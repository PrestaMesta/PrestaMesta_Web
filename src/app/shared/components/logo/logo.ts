import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Original PrestaMesta wordmark: an inline, dependency-free SVG isotype (shield + "P" + upward
 * growth mark) paired with the typographic lockup. No external image, no script, no remote
 * references — safe to inline directly in the document.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.html',
})
export class Logo {
  /** `light` for use on white/light surfaces, `dark` for use on the navy footer. */
  readonly theme = input<'light' | 'dark'>('light');
}

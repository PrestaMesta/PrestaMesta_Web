import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

export type StoreName = 'google-play' | 'app-store';

/**
 * "Próximamente" store badge. It is not a link to a non-existent store page — activating it
 * (click or keyboard) reveals an `aria-live` message instead, so the disabled-looking badge still
 * communicates something meaningful to everyone, including assistive technology users.
 */
@Component({
  selector: 'app-store-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './store-badge.html',
})
export class StoreBadge {
  readonly store = input.required<StoreName>();

  protected readonly messageVisible = signal(false);
  protected readonly messageId = computed(() => `store-badge-message-${this.store()}`);
  protected readonly storeLabel = computed(() =>
    this.store() === 'google-play' ? 'Google Play' : 'App Store',
  );

  toggleMessage(): void {
    this.messageVisible.update((visible) => !visible);
  }
}

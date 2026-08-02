import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keeps Tab/Shift+Tab cycling within the host element while `appFocusTrap` is `true`. Used by the
 * mobile navigation panel so keyboard users can't tab out into content hidden behind the overlay.
 */
@Directive({
  selector: '[appFocusTrap]',
})
export class FocusTrapDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly appFocusTrap = input(false);

  constructor() {
    effect((onCleanup) => {
      if (!this.appFocusTrap()) {
        return;
      }

      const host = this.elementRef.nativeElement;
      const unlisten = this.renderer.listen(host, 'keydown', (event: KeyboardEvent) =>
        this.handleKeydown(event, host),
      );

      onCleanup(unlisten);
    });
  }

  private handleKeydown(event: KeyboardEvent, host: HTMLElement): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = host.ownerDocument.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

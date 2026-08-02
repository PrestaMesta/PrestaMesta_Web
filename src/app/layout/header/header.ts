import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/components/icon/icon';
import { Logo } from '../../shared/components/logo/logo';
import { FocusTrapDirective } from '../../shared/directives/focus-trap.directive';

interface NavLink {
  readonly label: string;
  readonly fragment: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: 'Inicio', fragment: 'inicio' },
  { label: 'Beneficios', fragment: 'beneficios' },
  { label: 'Cómo funciona', fragment: 'como-funciona' },
  { label: 'Vista previa', fragment: 'vista-previa' },
  { label: 'Seguridad', fragment: 'seguridad' },
  { label: 'Preguntas frecuentes', fragment: 'preguntas-frecuentes' },
];

/** Sticky site header: desktop nav + an accessible mobile menu (focus trap, Escape, ARIA). */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Logo, FocusTrapDirective],
  templateUrl: './header.html',
})
export class Header {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);

  private readonly menuToggle = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');

  protected readonly navLinks = NAV_LINKS;
  protected readonly isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
    this.syncBodyScrollLock();

    if (this.isMenuOpen()) {
      const firstLink = this.menuPanel()?.nativeElement.querySelector<HTMLElement>('a, button');
      firstLink?.focus();
    }
  }

  closeMenu(): void {
    if (!this.isMenuOpen()) {
      return;
    }

    this.isMenuOpen.set(false);
    this.syncBodyScrollLock();
    this.menuToggle()?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
  }

  private syncBodyScrollLock(): void {
    if (this.isMenuOpen()) {
      this.renderer.addClass(this.document.body, 'overflow-hidden');
    } else {
      this.renderer.removeClass(this.document.body, 'overflow-hidden');
    }
  }
}

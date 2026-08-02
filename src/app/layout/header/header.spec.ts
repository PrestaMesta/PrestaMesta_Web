import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Header } from './header';

describe('Header', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    });
  });

  it('starts with the mobile menu closed', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const toggle = fixture.nativeElement.querySelector('button[aria-controls="mobile-menu-panel"]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the mobile menu on toggle click and closes it on a second click', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-controls="mobile-menu-panel"]',
    );

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the mobile menu when Escape is pressed', async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-controls="mobile-menu-panel"]',
    );

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});

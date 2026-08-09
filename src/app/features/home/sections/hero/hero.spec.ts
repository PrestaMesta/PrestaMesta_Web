import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Hero } from './hero';

describe('Hero', () => {
  it('keeps the primary "Descargar APK" CTA scrolling to the on-page download section', async () => {
    TestBed.configureTestingModule({
      imports: [Hero],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(Hero);
    await fixture.whenStable();

    const cta: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a[href*="descarga"]');
    expect(cta).not.toBeNull();
    expect(cta?.getAttribute('href')).toBe('/#descarga');
  });
});

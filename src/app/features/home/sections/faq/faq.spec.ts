import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Faq } from './faq';

describe('Faq', () => {
  it('renders every question as a closed, accessible native disclosure element', async () => {
    TestBed.configureTestingModule({ imports: [Faq] });
    const fixture = TestBed.createComponent(Faq);
    await fixture.whenStable();

    const details = fixture.nativeElement.querySelectorAll('details');
    expect(details.length).toBeGreaterThan(0);

    for (const detail of Array.from(details) as HTMLDetailsElement[]) {
      expect(detail.querySelector('summary')).toBeTruthy();
      expect(detail.open).toBe(false);
    }
  });
});

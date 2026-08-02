import { expect, test } from '@playwright/test';

// See home.spec.ts: wait for hydration before interacting with hydration-dependent controls
// (RouterLink clicks, Angular-bound button handlers) to avoid pre-hydration click flakiness.
const HYDRATED = { waitUntil: 'networkidle' } as const;

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens with the toggle button and closes with Escape', async ({ page }) => {
    await page.goto('/', HYDRATED);

    const toggle = page.locator('button[aria-controls="mobile-menu-panel"]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-menu-panel')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes after selecting a menu item', async ({ page }) => {
    await page.goto('/', HYDRATED);

    const toggle = page.locator('button[aria-controls="mobile-menu-panel"]');
    await toggle.click();

    await page.locator('#mobile-menu-panel a', { hasText: 'Beneficios' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#beneficios$/);
  });
});

test.describe('Keyboard-only navigation', () => {
  test('Tab reaches the skip link before any other interactive element', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    expect(focused).toBe('#main-content');
  });
});

test.describe('FAQ accordion', () => {
  test('opens an item on click and reveals its answer', async ({ page }) => {
    await page.goto('/#preguntas-frecuentes', HYDRATED);

    const firstItem = page.locator('#preguntas-frecuentes details').first();
    await expect(firstItem).not.toHaveAttribute('open', '');

    await firstItem.locator('summary').click();
    await expect(firstItem).toHaveAttribute('open', '');
  });
});

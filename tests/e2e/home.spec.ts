import { expect, test } from '@playwright/test';

// This is a hydrated SSR app: server-rendered markup exists before Angular's client bundle
// finishes hydrating it and wiring up RouterLink/click handlers. `networkidle` gives hydration
// time to complete before a test interacts with the page, avoiding pre-hydration click flakiness.
const HYDRATED = { waitUntil: 'networkidle' } as const;

test.describe('Home page', () => {
  test('shows the main hero heading and navigates via the header menu', async ({ page }) => {
    await page.goto('/', HYDRATED);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Tus préstamos, más claros y cerca de ti.',
    );

    await page.getByRole('navigation', { name: 'Principal' }).getByText('Beneficios').click();
    await expect(page).toHaveURL(/#beneficios$/);
    await expect(page.locator('#beneficios')).toBeInViewport();
  });

  test('has a working skip link that jumps to the main content', async ({ page }) => {
    await page.goto('/', HYDRATED);

    const skipLink = page.locator('a[href="#main-content"]');
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });

  test('every external link opens safely (target=_blank + rel=noopener noreferrer)', async ({
    page,
  }) => {
    await page.goto('/');
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('does not log serious console errors while browsing the main routes', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    for (const path of ['/', '/aviso-de-privacidad', '/terminos-de-uso', '/seguridad']) {
      await page.goto(path, HYDRATED);
    }

    expect(errors).toEqual([]);
  });

  test('shows the not-found page for an unknown route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'No encontramos esta página',
    );
  });
});

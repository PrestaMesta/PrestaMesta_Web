import { expect, test } from '@playwright/test';

// This is a hydrated SSR app: the server-rendered markup exists before Angular's client bundle
// finishes hydrating it. `networkidle` gives hydration time to complete so typed input isn't
// dispatched into a not-yet-interactive form control.
const HYDRATED = { waitUntil: 'networkidle' } as const;

test.describe('Launch notification form', () => {
  test('shows a validation error for an invalid email', async ({ page }) => {
    await page.goto('/#preguntas-frecuentes', HYDRATED);

    await page.locator('#email').fill('not-an-email');
    await page.getByRole('button', { name: 'Avísame cuando esté disponible' }).click();

    await expect(page.locator('#email-error')).toContainText('correo electrónico válido');
  });

  test('requires accepting the privacy notice before submitting', async ({ page }) => {
    await page.goto('/#preguntas-frecuentes', HYDRATED);

    await page.locator('#email').fill('demo@example.com');
    await page.getByRole('button', { name: 'Avísame cuando esté disponible' }).click();

    await expect(page.locator('#consent-error')).toContainText('aviso de privacidad');
  });

  test('submits successfully in demo mode with a valid email and consent', async ({ page }) => {
    await page.goto('/#preguntas-frecuentes', HYDRATED);

    await page.locator('#email').fill('demo@example.com');
    await page.locator('#consent').check();
    await page.getByRole('button', { name: 'Avísame cuando esté disponible' }).click();

    await expect(page.getByText('tu correo no fue almacenado')).toBeVisible();
  });

  test('the honeypot field is never reachable via keyboard Tab', async ({ page }) => {
    await page.goto('/#preguntas-frecuentes', HYDRATED);

    await page.locator('#email').focus();
    await page.keyboard.press('Tab');

    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).not.toBe('company');
  });
});

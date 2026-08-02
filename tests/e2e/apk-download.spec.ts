import { expect, test } from '@playwright/test';

test.describe('APK download — no configuration (default fixture)', () => {
  test('shows a disabled button and an explanatory message', async ({ page }) => {
    await page.goto('/#descarga');

    const disabledButton = page.locator('#descarga button[disabled]');
    await expect(disabledButton).toContainText('APK no disponible');
    await expect(page.locator('#descarga')).toContainText(
      'Todavía no existe una versión pública configurada',
    );
    await expect(page.locator('#descarga a[href]')).toHaveCount(0);
  });
});

test.describe('APK download — valid configuration (mocked)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/config/app-config.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          apkDownloadUrl: 'https://github.com/example/prestamesta/releases/app.apk',
          apkVersion: '0.1.0-demo',
          apkSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          apkReleaseDate: '2026-01-01',
          apkFileSize: '18.4 MB',
          siteUrl: '',
          githubUrl: '',
          contactEmail: '',
        }),
      }),
    );
  });

  test('shows an enabled download link and lets the hash be copied', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#descarga', { waitUntil: 'networkidle' });

    const downloadLink = page.locator('#descarga a', { hasText: 'Descargar APK' });
    await expect(downloadLink).toHaveAttribute(
      'href',
      'https://github.com/example/prestamesta/releases/app.apk',
    );
    await expect(downloadLink).toHaveAttribute('target', '_blank');
    await expect(downloadLink).toHaveAttribute('rel', 'noopener noreferrer');

    await expect(page.locator('#descarga')).toContainText(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );

    await page.getByRole('button', { name: 'Copiar hash' }).click();
    await expect(page.getByText('Hash copiado al portapapeles')).toBeVisible();
  });
});

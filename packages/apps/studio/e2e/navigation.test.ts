import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, horizontalOverflow, open, test } from './support/fixtures.ts';
import { STUDIO_ROOT } from './support/server.ts';

// The initial demo administrator is isolated from the accounts used by the workflow tests.
test.use({ user: 'admin' });

test('inbox navigation adapts to languages, themes, icon mode and the mobile drawer', async ({
  page,
  api,
}) => {
  // Capture all 24 combinations without changing per-interaction assertion timeouts.
  test.setTimeout(120_000);
  const directory = path.join(
    STUDIO_ROOT,
    'storage/ui-workflow/inbox-navigation/screenshots',
  );
  mkdirSync(directory, { recursive: true });
  await page.route('**/api/inbox/pending', (route) =>
    route.fulfill({ json: { data: { decision: 120 } } }),
  );
  for (const preset of ['compact', 'default']) {
    for (const locale of ['en-US', 'zh-CN']) {
      for (const mode of ['light', 'dark']) {
        await api.patch('users/me/preferences', {
          locale,
          'theme.mode': mode,
          'theme.preset': preset,
        });
        await page.setViewportSize({ width: 1440, height: 900 });
        await open(page, '/inbox');
        const name =
          locale === 'en-US' ? 'Inbox, 120 waiting' : '收件箱，120 项待处理';
        const nav = page.getByRole('navigation', {
          name: locale === 'en-US' ? 'Application navigation' : '应用导航',
        });
        const toggle = page.getByRole('banner').getByRole('button', {
          name: locale === 'en-US' ? /navigation/i : /导航/,
        });
        const sidebar = page.locator('[data-slot=sidebar]').first();
        if ((await sidebar.getAttribute('data-state')) === 'collapsed')
          await toggle.click();
        const link = nav.getByRole('link', { name, exact: true });
        await expect(link).toBeVisible();
        await expect(link.getByTestId('studio-inbox-badge')).toHaveText('99+');
        await expect(
          page
            .getByRole('banner')
            .getByRole('link', { name: /Inbox|收件箱/ })
            .and(page.locator('a[href]')),
        ).toHaveCount(0);
        await expect(page.locator('html')).toHaveAttribute(
          'data-theme',
          preset,
        );
        await expect(page.locator('html')).toHaveClass(new RegExp(mode, 'u'));
        // Canvas resolves the semantic OKLCH colors into sRGB for the AA calculation.
        const contrast = await page.evaluate<number>(`(() => {
        const badge = document.querySelector('[data-testid="studio-inbox-badge"]');
        const style = getComputedStyle(badge);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d');
        const luminance = (color) => {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const rgb = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
          const linear = rgb.map(value => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const background = luminance(style.backgroundColor);
        const foreground = luminance(style.color);
        return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
      })()`);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
        await page.screenshot({
          path: path.join(
            directory,
            `${preset}-${locale}-${mode}-expanded.png`,
          ),
          animations: 'disabled',
        });
        await toggle.click();
        await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
        await expect(link.getByTestId('studio-inbox-badge')).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate<boolean>(`(() => {
          const element = document.querySelector('[data-testid="studio-inbox-badge"]');
          const badge = element.getBoundingClientRect();
          const sidebar = element.closest('[data-slot="sidebar-content"]').getBoundingClientRect();
          return badge.left >= sidebar.left && badge.right <= sidebar.right && badge.width >= 18;
        })()`),
          )
          .toBe(true);
        await link.focus();
        await expect(link).toBeFocused();
        await page.keyboard.press('Enter');
        await page.screenshot({
          path: path.join(
            directory,
            `${preset}-${locale}-${mode}-collapsed.png`,
          ),
          animations: 'disabled',
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await expect(nav).toBeHidden();
        await toggle.click();
        await expect(nav).toBeVisible();
        await expect(
          nav
            .getByRole('link', { name, exact: true })
            .getByTestId('studio-inbox-badge'),
        ).toBeVisible();
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
        await page.screenshot({
          path: path.join(directory, `${preset}-${locale}-${mode}-mobile.png`),
          animations: 'disabled',
        });
        await nav.getByRole('link', { name, exact: true }).click();
        await expect(nav).toBeHidden();
      }
    }
  }
});

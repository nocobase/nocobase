/** Real persisted preview selection, deployed App, cleanup and project navigation; no API interception. */
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  Api,
  expect,
  horizontalOverflow,
  signIn,
  test,
} from './support/fixtures.ts';
import { startStudio, stopStudio, STUDIO_ROOT } from './support/server.ts';

test('cleans up the last unlinked preview through the real application in English', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const state = await startStudio({
    isolated: true,
    entry: path.join(STUDIO_ROOT, 'e2e/support/seeded-preview-server.mjs'),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  try {
    const fixturePath = path.join(state.directory, 'preview-fixture.json');
    await expect
      .poll(() => existsSync(fixturePath), { timeout: 120_000 })
      .toBe(true);
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
      projectId: string;
      previewId: string;
      appId: string;
      repo: string;
    };
    await signIn(context, 'alex', state);
    const api = new Api(context.request, state);
    await api.patch('users/me/preferences', {
      locale: 'en-US',
      'theme.mode': 'light',
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const screenshots = path.join(STUDIO_ROOT, 'output/screenshots/pm5-live');
    mkdirSync(screenshots, { recursive: true });
    const screenshot = (name: string) =>
      page.screenshot({
        path: path.join(screenshots, `${name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    await page.goto(`${state.baseURL}/projects/${fixture.projectId}/overview`);
    await page.getByRole('tab', { name: 'Releases', exact: true }).click();
    await expect(
      page.getByRole('link', {
        name: 'Manual pull request preview cleanup',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Manual preview target application', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Running', { exact: true })).toBeVisible();
    const rows = await api.get<{ id: string; url: string; admin: unknown }[]>(
      `previews?projectId=${fixture.projectId}`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].admin).toBeNull();
    const entry = await context.request.get(
      new URL(rows[0].url, state.origin).href,
    );
    expect(await entry.text()).toContain('PM-5 local preview fixture');
    await screenshot('01-group-information');
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await horizontalOverflow(page)).toBe(0);
    await screenshot('02-group-phone');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page
      .getByRole('button', { name: `Actions for ${fixture.repo} #7` })
      .click();
    await expect(
      page.getByRole('menuitem', { name: 'Destroy', exact: true }),
    ).toBeVisible();
    await screenshot('03-destroy-menu');
    await page.getByRole('menuitem', { name: 'Destroy', exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText(fixture.appId);
    await screenshot('04-destroy-confirmation');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(
      await api.get(`previews?projectId=${fixture.projectId}`),
    ).toHaveLength(1);
    await api.patch('users/me/preferences', { 'theme.mode': 'dark' });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page
      .getByRole('button', { name: `Actions for ${fixture.repo} #7` })
      .click();
    await page.getByRole('menuitem', { name: 'Destroy', exact: true }).click();
    await screenshot('05-destroy-confirmation-dark');
    await dialog.getByRole('button', { name: 'Destroy', exact: true }).click();
    await expect(page.getByText('No previews', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`/projects/${fixture.projectId}/releases$`),
    );
    await expect(
      page.getByRole('tab', { name: 'Releases', exact: true }),
    ).toBeVisible();
    expect(await api.get(`previews?projectId=${fixture.projectId}`)).toEqual(
      [],
    );
    expect(
      await api.get(`deploys/projects/${fixture.projectId}/unreleasedIssues`),
    ).toMatchObject({ hasProduction: false, hasPreview: false });
    await screenshot('06-empty-retained-tab');
    await page.getByRole('tab', { name: 'Overview', exact: true }).click();
    await expect(
      page.getByRole('tab', { name: 'Releases', exact: true }),
    ).toHaveCount(0);
    await screenshot('07-entry-hidden-after-leaving');
    await page.goto(`${state.baseURL}/projects/${fixture.projectId}/releases`);
    await expect(page).toHaveURL(
      new RegExp(`/projects/${fixture.projectId}/overview$`),
    );
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await stopStudio(state);
    if (!process.env.NB_STUDIO_E2E_KEEP)
      rmSync(state.directory, { recursive: true, force: true });
  }
});

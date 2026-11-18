import { expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { test } from './page-freshness.fixture.js';

test.use({
  locale: 'en-US',
  viewport: { width: 1280, height: 800 },
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

test('a project edited and deleted from its detail updates the searched, sorted list and its total', async ({
  page,
  freshness,
}, testInfo) => {
  const app = freshness.url.replace(/\/$/, '');
  await page.goto(`${app}/login`);
  await page
    .getByLabel('Username or email')
    .fill(freshness.credentials.username);
  await page
    .getByLabel('Password', { exact: true })
    .fill(freshness.credentials.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  const headers = { origin: new URL(app).origin };
  // Eleven matching projects and one that the search leaves out.
  for (const name of [
    ...Array.from(
      { length: 11 },
      (_, index) => `Site ${String(index + 1).padStart(2, '0')}`,
    ),
    'Archive',
  ]) {
    const created = await page.request.post(`${app}/api/skillProjects`, {
      headers: {
        ...headers,
        'Idempotency-Key': `${Date.now()}.${randomUUID()}`,
      },
      data: { name },
    });
    expect(created.ok()).toBe(true);
  }
  const reads: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      request.method() === 'GET' &&
      url.pathname.includes('/api/skillProjects')
    )
      reads.push(url.pathname.replace(/^.*\/api\//u, ''));
  });
  const source = `${app}/skill-projects?q=Site&sort=name&order=desc&page=2`;
  await page.goto(source);
  const total = page.getByTestId('projects-total');
  await expect(total).toHaveText('12');
  // Descending by name, the second page holds Site 01 alone.
  await page.getByRole('link', { name: 'Site 01', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Site 01', exact: true }),
  ).toBeVisible();

  // The covered list keeps its rows mounted; pick the detail's own action.
  await page
    .getByRole('button', { name: 'Edit', exact: true })
    .and(page.locator('[href$="/details/edit"]'))
    .click();
  const name = page.getByRole('textbox', { name: 'Name' });
  await name.fill('Site 01 renamed');
  reads.length = 0;
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Site 01 renamed', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveCount(0);
  // The detail took the save response; the covered list and total did not read.
  expect(reads).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath('1-detail-after-save.png'),
  });

  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Site 01 renamed', exact: true }),
  ).toBeVisible();
  expect(page.url()).toBe(source);
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(
    page.getByRole('searchbox', { name: 'Search projects' }),
  ).toHaveValue('Site');
  await expect(total).toHaveText('12');
  await page.screenshot({ path: testInfo.outputPath('2-list-after-edit.png') });

  await page
    .getByRole('link', { name: 'Site 01 renamed', exact: true })
    .click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText('Delete “Site 01 renamed”?');
  await page.screenshot({ path: testInfo.outputPath('3-delete-confirm.png') });
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
  // The emptied second page is corrected to the last valid page.
  await expect(page).toHaveURL(
    `${app}/skill-projects?q=Site&sort=name&order=desc&page=1`,
  );
  await expect(
    page.getByRole('link', { name: 'Site 11', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Site 01 renamed', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('Page 1 of 1')).toBeVisible();
  await expect(total).toHaveText('11');
  await expect(page.getByText('Deleted “Site 01 renamed”.')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('4-list-after-delete.png'),
  });
});

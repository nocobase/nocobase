import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const applicationUrl = process.env.APP_URL;
test.skip(
  !applicationUrl || !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
  'Set an independent disposable APP_URL and synthetic E2E_USERNAME/E2E_PASSWORD.',
);
test.use({
  locale: 'en-US',
  viewport: { width: 1440, height: 1000 },
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

test('workflow completion reaches the open detail through existing source events', async ({
  page,
}, testInfo) => {
  const app = applicationUrl!.replace(/\/$/, '');
  await page.goto(`${app}/login`);
  await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  const headers = { origin: new URL(app).origin };
  const created = await page.request.post(
    `${app}/api/lifecycleExample/exports`,
    {
      headers,
      data: {
        title: `Freshness ${randomUUID()}`,
        durationSeconds: 5,
        vendorOutcome: 'success',
      },
    },
  );
  expect(created.ok()).toBe(true);
  const { data: record } = (await created.json()) as { data: { id: number } };
  await page.goto(`${app}/workflows/executions/lifecycle.exports/${record.id}`);
  await page.getByTestId('rf__node-draft').waitFor();
  await expect(
    page
      .getByTestId('rf__node-draft')
      .locator('[data-execution-state="current"]'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Refresh', exact: true }),
  ).toHaveCount(0);
  const submitted = await page.request.post(
    `${app}/api/lifecycleExample/exports/${record.id}/fire`,
    {
      headers,
      data: { transition: 'submit', input: {}, requestId: randomUUID() },
    },
  );
  expect(submitted.ok()).toBe(true);
  // The example's existing vendor check runs at its configured 15-second interval.
  await expect(
    page
      .getByTestId('rf__node-done')
      .locator('[data-execution-state="current"]'),
  ).toBeVisible({ timeout: 30_000 });
  const screenshots =
    process.env.E2E_EVIDENCE_DIR ?? testInfo.outputPath('screenshots');
  await mkdir(screenshots, { recursive: true });
  for (const [size, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.screenshot({
      path: path.join(screenshots, `workflow-complete-${size}.png`),
      fullPage: true,
    });
  }
});

test('ordinary pages retain writes, read recovery and URL state without a Refresh action', async ({
  page,
}, testInfo) => {
  const app = applicationUrl!.replace(/\/$/, '');
  const screenshots =
    process.env.E2E_EVIDENCE_DIR ?? testInfo.outputPath('screenshots');
  await mkdir(screenshots, { recursive: true });
  await page.goto(`${app}/login`);
  await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));

  let writes = 0;
  page.on('request', (request) => {
    if (
      request.url().includes('/api/customerContacts/') &&
      ['POST', 'PATCH', 'DELETE'].includes(request.method())
    )
      writes += 1;
  });
  await page.goto(`${app}/customer-contacts?page=2&pageSize=10`);
  await expect(
    page.getByRole('link', { name: 'Acorn 11', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Refresh', exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('link', { name: 'Acorn 11', exact: true }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get('page')).toBe('2');
  expect(writes).toBe(0);

  await page.goto(`${app}/customer-contacts?search=Acorn`);
  await page.getByRole('link', { name: 'Acorn 01', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Acorn 01', exact: true }),
  ).toBeVisible();
  const detailUrl = page.url();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Acorn 01', exact: true }),
  ).toBeVisible();
  expect(page.url()).toBe(detailUrl);
  expect(new URL(page.url()).searchParams.get('search')).toBe('Acorn');
  expect(writes).toBe(0);

  const suffix = randomUUID().slice(0, 8);
  const customerName = `Acorn ${suffix}`;
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Name *', exact: true })
    .fill(customerName);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: customerName, exact: true }),
  ).toBeVisible();

  const contactName = `Contact ${suffix}`;
  await page.getByRole('button', { name: 'New contact', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Name *', exact: true })
    .fill(contactName);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(
    page.getByRole('link', { name: contactName, exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: `Actions for ${contactName}`, exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: contactName, exact: true }),
  ).toHaveCount(0);
  const afterWrites = writes;
  await page.reload();
  await expect(
    page.getByRole('heading', { name: customerName, exact: true }),
  ).toBeVisible();
  expect(writes).toBe(afterWrites);

  for (const [size, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await expect(
      page.getByRole('button', { name: 'Refresh', exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: path.join(screenshots, `customer-detail-${size}.png`),
      fullPage: true,
    });
    await page.goto(`${app}/customer-contacts?search=Acorn`);
    await expect(
      page.getByRole('link', { name: customerName, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Refresh', exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: path.join(screenshots, `customer-list-${size}.png`),
      fullPage: true,
    });
    await page.goto(detailUrl);
    await expect(
      page.getByRole('heading', { name: customerName, exact: true }),
    ).toBeVisible();
  }

  // Restore this test's edited sample before checking failed-read recovery.
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Name *', exact: true })
    .fill('Acorn 01');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Acorn 01', exact: true }),
  ).toBeVisible();
  let failRead = true;
  await page.route('**/api/customerContacts/customers?*', async (route) => {
    if (failRead)
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { status: 'UNAVAILABLE', message: 'Unavailable' },
        }),
      });
    else await route.continue();
  });
  try {
    await page.goto(`${app}/customer-contacts?search=Acorn`);
    await expect(
      page.getByRole('button', { name: 'Retry', exact: true }),
    ).toBeVisible();
    const beforeRetry = writes;
    failRead = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(
      page.getByRole('link', { name: 'Acorn 01', exact: true }),
    ).toBeVisible();
    expect(writes).toBe(beforeRetry);
    await expect(
      page.getByRole('button', { name: 'Retry', exact: true }),
    ).toHaveCount(0);
  } finally {
    failRead = false;
  }
});

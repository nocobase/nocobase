import { expect, test } from '@playwright/test';

const applicationUrl = process.env.APP_URL;
test.skip(
  !applicationUrl || !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
  'Set APP_URL to the running application entry, and E2E_USERNAME/E2E_PASSWORD.',
);
test.use({
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

test('opens workflow-owned configuration and preserves conflicting drafts', async ({
  page,
}) => {
  const app = applicationUrl!.replace(/\/$/, '');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(app + '/login');
  await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  await page.goto(app + '/workflows/definitions/lifecycle.expenses');
  await expect(
    page.getByRole('heading', { name: 'Draft', exact: true }),
  ).toBeVisible();
  const endpoint =
    app + '/api/workflows/definitions/lifecycle.expenses/parameters';
  const read = async (): Promise<{
    values: Record<string, number>;
    revision: number;
  }> => {
    const result = await (await page.request.get(endpoint)).json();
    return result.data;
  };
  const original = await read();
  try {
    const expense = page.getByRole('region', { name: 'Parameter settings' });
    const input = expense.getByLabel('Automatic approval limit (yuan)');
    await input.fill('501');
    await page
      .getByRole('button', { name: 'Save parameters', exact: true })
      .click();
    await expect
      .poll(async () => (await read()).revision)
      .toBe(original.revision + 1);
    const saved = await read();
    await input.fill('502');
    const competing = await page.request.put(endpoint, {
      headers: { origin: new URL(app).origin },
      data: {
        kind: 'lifecycle',
        values: original.values,
        expectedRevision: saved.revision,
        requestId: 'browser-competing-' + Date.now(),
      },
    });
    expect(competing.status()).toBe(200);
    await page
      .getByRole('button', { name: 'Save parameters', exact: true })
      .click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(input).toHaveValue('502');
    await page
      .getByRole('button', { name: 'Load latest revision and keep draft' })
      .click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Save parameters', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(async () => (await read()).revision)
      .toBe(saved.revision + 2);
    await page.getByTestId('rf__node-awaitingManager').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(
      expense.getByLabel('Finance review limit (yuan)'),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    const current = await read();
    const restored = await page.request.put(endpoint, {
      headers: { origin: new URL(app).origin },
      data: {
        kind: 'lifecycle',
        values: original.values,
        expectedRevision: current.revision,
        requestId: 'browser-restore-' + Date.now(),
      },
    });
    expect(restored.status()).toBe(200);
  }
});

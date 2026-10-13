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

test('shares configuration editors, preserves conflicts and enforces read-only controls', async ({
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
  await page.goto(app + '/lifecycle-example/parameters');
  await expect(
    page.getByRole('heading', { name: 'Expense thresholds', exact: true }),
  ).toBeVisible();
  const endpoint =
    app + '/api/lifecycleExample/parameterGroups/expenseThresholds?actAs=zhao';
  const read = async (): Promise<{
    values: Record<string, number>;
    revision: number;
  }> => (await (await page.request.get(endpoint)).json()).data;
  const original = await read();
  try {
    const expense = page
      .locator('section')
      .filter({
        has: page.getByRole('heading', {
          name: 'Expense thresholds',
          exact: true,
        }),
      })
      .last();
    const input = expense.getByLabel('Automatic approval limit (yuan)');
    await input.fill('501');
    await expense
      .getByRole('button', { name: 'Save values', exact: true })
      .click();
    await expect(
      expense.getByText('Configuration saved.', { exact: true }),
    ).toBeVisible();
    const saved = await read();
    await input.fill('502');
    const competing = await page.request.put(endpoint, {
      headers: { origin: new URL(app).origin },
      data: {
        values: original.values,
        expectedRevision: saved.revision,
        requestId: 'browser-competing-' + Date.now(),
      },
    });
    expect(competing.status()).toBe(200);
    await expense
      .getByRole('button', { name: 'Save values', exact: true })
      .click();
    await expect(
      expense.getByText(
        'The revision changed. Your inputs have been preserved; review the current values before retrying.',
      ),
    ).toBeVisible();
    await expect(input).toHaveValue('502');
    await expense
      .getByRole('button', { name: 'Keep my inputs and use this revision' })
      .click();
    await expense
      .getByRole('button', { name: 'Save values', exact: true })
      .click();
    await expect(
      expense.getByText('Configuration saved.', { exact: true }),
    ).toBeVisible();
    await page.getByTestId('rf__node-awaitingManager').click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Edit current configuration' }),
    ).toBeVisible();
    await expect(
      dialog.getByLabel('Automatic approval limit (yuan)'),
    ).toBeVisible();
    await expect(
      dialog.getByLabel('Finance review limit (yuan)'),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await page.getByTestId('rf__node-paid').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Signed in as' }).click();
    await page.getByRole('option', { name: '林晓 · 市场部 · 专员' }).click();
    await expect(
      page.getByRole('button', { name: 'Save values', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel('Automatic approval limit (yuan)'),
    ).toBeDisabled();
    expect(errors).toEqual([]);
  } finally {
    const current = await read();
    const restored = await page.request.put(endpoint, {
      headers: { origin: new URL(app).origin },
      data: {
        values: original.values,
        expectedRevision: current.revision,
        requestId: 'browser-restore-' + Date.now(),
      },
    });
    expect(restored.status()).toBe(200);
  }
});

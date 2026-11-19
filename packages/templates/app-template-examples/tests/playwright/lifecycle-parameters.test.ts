import { expect, test } from '@playwright/test';

const applicationUrl = process.env.APP_URL;
test.skip(
  !applicationUrl || !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
  'Set APP_URL to the running application entry, and E2E_USERNAME/E2E_PASSWORD.',
);
test.use({
  viewport: { width: 1440, height: 1000 },
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
  await page.goto(app + '/workflows/definitions/lifecycle.expenses?version=1');
  await expect(
    page.getByRole('heading', { name: 'Draft', exact: true }),
  ).toBeVisible();
  const endpoint =
    app + '/api/workflows/definitions/lifecycle.expenses/parameters?version=1';
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
        definition: 'expenses',
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
        definition: 'expenses',
        values: original.values,
        expectedRevision: current.revision,
        requestId: 'browser-restore-' + Date.now(),
      },
    });
    expect(restored.status()).toBe(200);
  }
});

test('protects unsaved version parameters and saves only the original definition', async ({
  page,
}) => {
  const app = applicationUrl!.replace(/\/$/, '');
  await page.goto(app + '/login');
  await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  const endpoint = (version: number) =>
    app +
    `/api/workflows/definitions/lifecycle.expenses/parameters?version=${version}`;
  const read = async (version: number) =>
    (await (await page.request.get(endpoint(version))).json()).data as {
      values: Record<string, number>;
      revision: number;
    };
  const original = [await read(1), await read(2)];
  try {
    await page.goto(
      app + '/workflows/definitions/lifecycle.expenses?version=1',
    );
    const input = page.getByLabel('Automatic approval limit (yuan)', {
      exact: true,
    });
    await expect(input).toHaveValue(
      String(original[0].values.autoApproveLimit),
    );
    await input.fill('501');
    const choose = async (version: number) => {
      await page
        .getByRole('combobox', { name: 'Version', expanded: false })
        .click();
      await page
        .getByRole('option', {
          name: version === 2 ? 'Version 2 (latest)' : 'Version 1',
          exact: true,
        })
        .click();
    };
    await choose(2);
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.screenshot({
      path: process.env.PARAMETER_SCREENSHOT_DIR
        ? process.env.PARAMETER_SCREENSHOT_DIR + '/unsaved-version-dialog.png'
        : 'test-results/unsaved-version-dialog.png',
    });
    await dialog.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page).toHaveURL(/version=1/);
    await expect(input).toHaveValue('501');
    await page.route(
      '**/api/workflows/definitions/lifecycle.expenses/parameters?version=1',
      async (route) => {
        if (route.request().method() !== 'PUT') return route.continue();
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 500,
              status: 'INTERNAL',
              reason: 'TEST_SAVE_FAILED',
              message: 'Save failed. Retry without leaving this version.',
            },
          }),
        });
      },
    );
    await choose(2);
    await dialog
      .getByRole('button', { name: 'Save parameters', exact: true })
      .click();
    await expect(
      page.getByText('Save failed. Retry without leaving this version.', {
        exact: false,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/version=1/);
    await expect(input).toHaveValue('501');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Keep editing' }).click();
    await page.unroute(
      '**/api/workflows/definitions/lifecycle.expenses/parameters?version=1',
    );
    await choose(2);
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Save parameters', exact: true })
      .click();
    await expect(page).toHaveURL(/version=2/);
    await expect(
      page.getByText('Configuring v2.', { exact: false }),
    ).toBeVisible();
    await expect(input).toHaveValue(
      String(original[1].values.autoApproveLimit),
    );
    expect((await read(1)).values.autoApproveLimit).toBe(501);
    expect((await read(2)).values).toEqual(original[1].values);
    if (process.env.PARAMETER_SCREENSHOT_DIR) {
      await page.screenshot({
        path: process.env.PARAMETER_SCREENSHOT_DIR + '/version-2-desktop.png',
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      const panel = page.getByRole('region', { name: 'Parameter settings' });
      await expect(panel).toBeVisible();
      await panel.screenshot({
        path: process.env.PARAMETER_SCREENSHOT_DIR + '/version-2-phone.png',
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await input.fill('502');
    await page.goBack();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Keep editing' })
      .click();
    await expect(page).toHaveURL(/version=2/);
    await expect(input).toHaveValue('502');
    await choose(1);
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Discard changes' })
      .click();
    await expect(page).toHaveURL(/version=1/);
    expect((await read(2)).values).toEqual(original[1].values);
  } finally {
    for (const version of [1, 2]) {
      const current = await read(version);
      const restored = await page.request.put(endpoint(version), {
        headers: { origin: new URL(app).origin },
        data: {
          kind: 'lifecycle',
          definition: version === 1 ? 'expenses' : 'expenses-v2',
          values: original[version - 1].values,
          expectedRevision: current.revision,
          requestId: `restore-version-${version}-${Date.now()}`,
        },
      });
      expect(restored.status()).toBe(200);
    }
  }
});

test('ignores a previous version configuration response arriving after version navigation', async ({
  page,
}) => {
  const app = applicationUrl!.replace(/\/$/, '');
  await page.goto(app + '/login');
  await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  let release!: () => void;
  let intercepted!: () => void;
  const waiting = new Promise<void>((resolve) => {
    intercepted = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const endpoint =
    '**/api/workflows/definitions/lifecycle.expenses/parameters?version=1';
  await page.route(endpoint, async (route) => {
    const response = await route.fetch();
    intercepted();
    await gate;
    await route.fulfill({ response });
  });
  try {
    const current = (
      await (
        await page.request.get(
          app +
            '/api/workflows/definitions/lifecycle.expenses/parameters?version=2',
        )
      ).json()
    ).data;
    await page.goto(
      app + '/workflows/definitions/lifecycle.expenses?version=1',
    );
    await waiting;
    await page
      .getByRole('combobox', { name: 'Version', expanded: false })
      .click();
    await page
      .getByRole('option', { name: 'Version 2 (latest)', exact: true })
      .click();
    await expect(page).toHaveURL(/version=2/);
    const input = page.getByLabel('Automatic approval limit (yuan)', {
      exact: true,
    });
    await expect(input).toHaveValue(String(current.values.autoApproveLimit));
    const late = page.waitForResponse((response) =>
      response.url().endsWith('/lifecycle.expenses/parameters?version=1'),
    );
    release();
    await late;
    await page.unroute(endpoint);
    await expect(
      page.getByText('Configuring v2.', { exact: false }),
    ).toBeVisible();
    await expect(input).toHaveValue(String(current.values.autoApproveLimit));
  } finally {
    release();
    await page.unroute(endpoint);
  }
});

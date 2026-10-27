import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Run against disposable generated applications prepared with tests/fixtures/submission.
const applications = JSON.parse(
  process.env.SUBMISSION_APPLICATIONS ?? '[]',
) as { name: string; url: string; beforeData?: string }[];
if (!applications.length)
  throw new Error(
    'Set SUBMISSION_APPLICATIONS to the generated and upgraded fixture application entry URLs.',
  );
type Evidence = {
  rows: { id: string; name: string; assetTag: string; status: string }[];
  entries: { borrowingId: string }[];
  history: { recordId: string }[];
};
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

for (const app of applications) {
  test(`${app.name}: shared submission and retained business customizations`, async ({
    page,
  }, testInfo) => {
    await page.goto(`${app.url}/submission-check`);
    await page
      .getByRole('textbox', { name: 'Username or email' })
      .fill('nocobase');
    await page.getByLabel('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));
    await page.goto(`${app.url}/submission-check`);
    await page.getByRole('heading', { name: 'Equipment borrowing' }).waitFor();
    const form = page
      .getByRole('heading', { name: 'Equipment borrowing' })
      .locator('..');
    const status = form.getByRole('status');
    const evidence = async (): Promise<Evidence> => {
      const response = await page.request.get(
        `${app.url}/api/submissionFixture/evidence`,
      );
      expect(response.ok()).toBe(true);
      return (await response.json()).data as Evidence;
    };
    const original = await evidence();
    if (app.beforeData) {
      const before = JSON.parse(
        await readFile(app.beforeData, 'utf8'),
      ) as Evidence;
      for (const row of before.rows)
        expect(original.rows.find((item) => item.id === row.id)).toEqual(row);
    }
    await expect(form).toHaveCSS('border-top-color', 'rgb(37, 99, 235)');
    await page.getByLabel('Custom asset tag').fill('invalid');
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText('Name and CUSTOM- asset tag are required');
    expect((await evidence()).rows).toHaveLength(original.rows.length);
    await page.getByLabel('Custom asset tag').fill('CUSTOM-001');

    // Hold a committed response: double click, Enter and programmatic submit share one immediate lock.
    let creates = 0;
    const held = gate();
    const committed = gate();
    await page.route('**/api/borrowings/createOne', async (route) => {
      creates++;
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      committed.release();
      await held.promise;
      await route.fulfill({ response });
    });
    await form.getByRole('button', { name: 'Save', exact: true }).dblclick();
    await committed.promise;
    await page.getByLabel('Equipment name').press('Enter');
    await form
      .locator('form')
      .evaluate((element) =>
        (element as { requestSubmit(): void }).requestSubmit(),
      );
    await expect(
      form.getByRole('button', { name: 'Submitting…' }),
    ).toBeDisabled();
    expect(creates).toBe(1);
    await form.screenshot({ path: testInfo.outputPath('submitting.png') });
    await testInfo.attach('Submitting (English)', {
      path: testInfo.outputPath('submitting.png'),
      contentType: 'image/png',
    });
    held.release();
    await expect(status).toHaveText('Saved successfully');
    await page.unroute('**/api/borrowings/createOne');
    const firstId = await page.getByTestId('record-id').innerText();
    expect((await evidence()).rows).toHaveLength(original.rows.length + 1);

    // A deliberate new operation with identical fields creates another record.
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect
      .poll(async () => (await evidence()).rows.length)
      .toBe(original.rows.length + 2);
    const secondId = await page.getByTestId('record-id').innerText();
    expect(secondId).not.toBe(firstId);
    await page.getByLabel('Operation').selectOption('update');
    await page.getByLabel('Equipment name').fill('Camera updated');
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect
      .poll(
        async () =>
          (await evidence()).rows.find((row) => row.id === secondId)?.name,
      )
      .toBe('Camera updated');

    // A definite server refusal retains the fields and allows correction/retry.
    await page.getByLabel('Operation').selectOption('create');
    await page.route('**/api/borrowings/createOne', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'INVALID_ARGUMENT',
            status: 400,
            reason: 'INVALID_INPUT',
            domain: 'app',
            message: 'Synthetic rejection',
            requestId: 'synthetic',
          },
        }),
      }),
    );
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText(
      'Request failed; input retained. Retry to confirm the outcome.',
    );
    await expect(page.getByLabel('Equipment name')).toHaveValue(
      'Camera updated',
    );
    await form.screenshot({ path: testInfo.outputPath('failed.png') });
    await testInfo.attach('Failure with retained input (English)', {
      path: testInfo.outputPath('failed.png'),
      contentType: 'image/png',
    });
    await page.unroute('**/api/borrowings/createOne');

    // Commit on the server, then drop the response; retry uses exactly the original key and body.
    let lostKey = '';
    let lostBody = '';
    let replayed = false;
    await page.route('**/api/borrowings/createOne', async (route) => {
      lostKey = route.request().headers()['idempotency-key'];
      lostBody = route.request().postData() ?? '';
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await route.abort('failed');
    });
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText(
      'Request failed; input retained. Retry to confirm the outcome.',
    );
    expect((await evidence()).rows).toHaveLength(original.rows.length + 3);
    await page.unroute('**/api/borrowings/createOne');
    await page.getByLabel('Equipment name').fill('Changed while uncertain');
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText(
      'Retry the original operation before changing input',
    );
    await page.getByLabel('Equipment name').fill('Camera updated');
    await page.route('**/api/borrowings/createOne', async (route) => {
      expect(route.request().headers()['idempotency-key']).toBe(lostKey);
      expect(route.request().postData()).toBe(lostBody);
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      replayed = response.headers()['idempotency-replayed'] === 'true';
      await route.fulfill({ response });
    });
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText('Saved successfully');
    expect(replayed).toBe(true);
    expect((await evidence()).rows).toHaveLength(original.rows.length + 3);
    await page.unroute('**/api/borrowings/createOne');
    const approvalId = await page.getByTestId('record-id').innerText();

    // Lifecycle state, history and inventory effect join the same receipt transaction.
    await page.getByLabel('Operation').selectOption('approve');
    let approvalKey = '';
    let approvalBody = '';
    await page.route('**/api/submissionFixture/*/approve', async (route) => {
      approvalKey = route.request().headers()['idempotency-key'];
      approvalBody = route.request().postData() ?? '';
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await route.abort('failed');
    });
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText(
      'Request failed; input retained. Retry to confirm the outcome.',
    );
    await page.unroute('**/api/submissionFixture/*/approve');
    const accessChange = await page.request.post(
      `${app.url}/api/submissionFixture/fixtureAccess`,
      {
        headers: { Origin: new URL(app.url).origin },
        data: { revoked: true },
      },
    );
    expect(accessChange.status()).toBe(200);
    const denied = await page.request.post(
      `${app.url}/api/submissionFixture/${approvalId}/approve`,
      {
        headers: {
          'Idempotency-Key': approvalKey,
          Origin: new URL(app.url).origin,
        },
        data: JSON.parse(approvalBody),
      },
    );
    expect(denied.status()).toBe(403);
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText(
      'Request failed; input retained. Retry to confirm the outcome.',
    );
    await page.request.post(`${app.url}/api/submissionFixture/fixtureAccess`, {
      headers: { Origin: new URL(app.url).origin },
      data: { revoked: false },
    });
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(status).toHaveText('Approved once');
    const after = await evidence();
    expect(after.rows.find((row) => row.id === approvalId)?.status).toBe(
      'approved',
    );
    expect(
      after.entries.filter((entry) => entry.borrowingId === approvalId),
    ).toHaveLength(1);
    expect(
      after.history.filter((entry) => entry.recordId === approvalId),
    ).toHaveLength(1);
    for (const row of original.rows)
      expect(after.rows.find((item) => item.id === row.id)).toEqual(row);
    await form.screenshot({ path: testInfo.outputPath('success.png') });
    await testInfo.attach('Successful approval (English)', {
      path: testInfo.outputPath('success.png'),
      contentType: 'image/png',
    });
    await testInfo.attach('Business invariants', {
      body: Buffer.from(
        JSON.stringify(
          {
            retainedRows: original.rows.length,
            addedRows: 3,
            effectsForApproval: 1,
            historyForApproval: 1,
            replayedCreate: replayed,
          },
          null,
          2,
        ),
      ),
      contentType: 'application/json',
    });
  });
}

import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { OnboardingDetail } from '../../shared/onboarding.js';
const applicationUrl = process.env.APP_URL;
test.skip(
  !applicationUrl || !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
  'Set an independent disposable APP_URL and synthetic E2E_USERNAME/E2E_PASSWORD.',
);
test.use({
  actionTimeout: 10_000,
  viewport: { width: 1440, height: 1000 },
  locale: 'en-US',
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});
const choose = async (page: Page, label: string, name: string) => {
  const control = page.getByRole('combobox', { name: label, exact: true });
  await expect(control).toBeEnabled();
  await control.click();
  await page.getByRole('option', { name, exact: true }).click();
};
async function fixture(browser: Browser) {
  const app = applicationUrl!.replace(/\/$/, '');
  const origin = new URL(app).origin;
  const contexts: BrowserContext[] = [];
  const admin = await browser.newContext();
  contexts.push(admin);
  const login = await admin.newPage();
  await login.goto(app + '/login');
  await login.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
  await login
    .getByLabel('Password', { exact: true })
    .fill(process.env.E2E_PASSWORD!);
  await login.getByRole('button', { name: 'Sign in', exact: true }).click();
  await login.waitForURL((url) => !url.pathname.endsWith('/login'));
  const document = await (await admin.request.get(app + '/api/swagger')).json();
  expect(document.paths['/api/onboarding/{id}/fire']).toBeTruthy();
  const actors: Record<string, { context: BrowserContext; page: Page }> = {};
  for (const [name, role] of [
    ['owner', 'coordinator'],
    ['other', 'coordinator'],
    ['viewer', 'viewer'],
  ] as const) {
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1440, height: 1000 },
    });
    contexts.push(context);
    const credentials = {
      name: `Browser ${name}`,
      email: `${name}-${randomUUID()}@onboarding.example.test`,
      password: 'Synthetic-onboarding-browser-password',
    };
    const registered = await context.request.post(
      app + '/api/auth/sign-up/email',
      { headers: { origin }, data: credentials },
    );
    expect(registered.status()).toBe(200);
    const user = (await registered.json()).user;
    expect(
      (
        await admin.request.post(
          app +
            `/api/authorization/permissionSets/onboarding-${role}/assignments`,
          {
            headers: { origin },
            data: { id: randomUUID(), subject: { type: 'user', id: user.id } },
          },
        )
      ).ok(),
    ).toBe(true);
    expect(
      (
        await context.request.post(app + '/api/auth/sign-in/email', {
          headers: { origin },
          data: { email: credentials.email, password: credentials.password },
        })
      ).ok(),
    ).toBe(true);
    actors[name] = { context, page: await context.newPage() };
  }
  return {
    app,
    origin,
    actors,
    close: () => Promise.allSettled(contexts.map((c) => c.close())),
  };
}
test('four-step form preserves values, restores drafts and submits one employee with retriable receipts', async ({
  browser,
}, testInfo) => {
  const f = await fixture(browser);
  const page = f.actors.owner.page;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const directory =
    process.env.E2E_EVIDENCE_DIR ?? testInfo.outputPath('screenshots');
  await mkdir(directory, { recursive: true });
  const snapshot = async (name: string) =>
    page.screenshot({ path: path.join(directory, name), fullPage: true });
  try {
    await page.goto(f.app + '/onboarding');
    await expect(
      page.getByText('No onboarding cases.', { exact: true }),
    ).toBeVisible();
    await snapshot('onboarding-list-empty.png');
    await page
      .getByRole('button', { name: 'New onboarding', exact: true })
      .click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(
      page.getByText(
        'Check the highlighted fields and required documents before continuing.',
      ),
    ).toBeVisible();
    const name = `Example employee ${randomUUID().slice(0, 8)}`;
    await page.getByLabel('Full name', { exact: true }).pressSequentially(name);
    await page
      .getByLabel('Work email', { exact: true })
      .fill(`employee-${randomUUID()}@example.test`);
    await page.getByLabel('Nationality (two-letter code)').fill('US');
    await snapshot('onboarding-basic.png');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await choose(page, 'Department', 'Engineering');
    await page.getByLabel('Job title', { exact: true }).fill('Engineer');
    await choose(page, 'Employment type', 'Contractor');
    await page.getByLabel('Start date', { exact: true }).fill('2026-12-01');
    await page
      .getByLabel('Contract end date', { exact: true })
      .fill('2026-11-30');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(
      page.getByText(
        'Check the highlighted fields and required documents before continuing.',
      ),
    ).toBeVisible();
    await page
      .getByLabel('Contract end date', { exact: true })
      .fill('2027-12-01');
    let writes = 0;
    page.on('request', (request) => {
      if (
        request.url().includes('/api/onboarding') &&
        request.method() !== 'GET'
      )
        writes++;
    });
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(page.getByLabel('Full name', { exact: true })).toHaveValue(
      name,
    );
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByLabel('Job title', { exact: true })).toHaveValue(
      'Engineer',
    );
    expect(writes).toBe(0);
    await snapshot('onboarding-employment.png');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Documents', exact: true }),
    ).toBeVisible();
    const id = new URL(page.url()).pathname.split('/').pop()!;
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Documents', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(
      page.getByText(
        'Check the highlighted fields and required documents before continuing.',
      ),
    ).toBeVisible();
    for (const [index, kind, title, reference] of [
      [1, 'Identity document', 'Synthetic identity', 'ID-001'],
      [2, 'Work permit', 'Synthetic permit', 'WP-001'],
      [3, 'Service agreement', 'Synthetic agreement', 'SA-001'],
    ] as const) {
      await page
        .getByRole('button', { name: 'Add document', exact: true })
        .click();
      await choose(page, `Document type ${index}`, kind);
      await page
        .getByLabel(`Document title ${index}`, { exact: true })
        .fill(title);
      await page
        .getByLabel(`Reference number ${index}`, { exact: true })
        .fill(reference);
    }
    await snapshot('onboarding-documents.png');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Confirm submission', exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('dd').getByText(name, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Submit onboarding', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Submit onboarding', exact: true }),
    ).toBeEnabled();
    await snapshot('onboarding-confirmation.png');
    const fire = page.waitForRequest((request) =>
      request.url().endsWith(`/onboarding/${id}/fire`),
    );
    await page
      .getByRole('button', { name: 'Submit onboarding', exact: true })
      .evaluate((button) => {
        const target = button as unknown as { click(): void };
        target.click();
        target.click();
      });
    const request = await fire;
    await expect(
      page.getByRole('heading', { name: 'Employee created', exact: true }),
    ).toBeVisible();
    const saved = (
      await (
        await f.actors.owner.context.request.get(
          f.app + '/api/onboarding/' + id,
        )
      ).json()
    ).data as OnboardingDetail;
    expect(saved.history.map((h) => h.to)).toEqual(['draft', 'submitted']);
    expect(saved.employee?.caseId).toBe(id);
    const replay = await f.actors.owner.context.request.post(
      f.app + `/api/onboarding/${id}/fire`,
      {
        headers: {
          origin: f.origin,
          'Idempotency-Key': request.headers()['idempotency-key'],
        },
        data: request.postDataJSON(),
      },
    );
    expect(replay.status()).toBe(200);
    expect(replay.headers()['idempotency-replayed']).toBe('true');
    await snapshot('onboarding-submitted.png');
    await page.setViewportSize({ width: 390, height: 844 });
    const popup = page.getByRole('dialog');
    await expect(popup).toHaveCSS('width', '390px');
    await expect(popup).toHaveJSProperty('scrollLeft', 0);
    expect(
      (await popup.locator('header').boundingBox())!.x,
    ).toBeGreaterThanOrEqual(0);
    expect(
      await popup.locator('[data-slot=route-overlay-body]').evaluate((el) => {
        const body = el as unknown as {
          scrollWidth: number;
          clientWidth: number;
        };
        return body.scrollWidth <= body.clientWidth;
      }),
    ).toBe(true);
    await snapshot('onboarding-mobile.png');
    expect(
      await page.evaluate(
        'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
      ),
    ).toBe(true);
    const viewer = f.actors.viewer.page;
    await viewer.goto(f.app + '/onboarding/' + id);
    await expect(
      viewer.getByRole('heading', { name: 'Employee created' }),
    ).toBeVisible();
    await expect(
      viewer.getByRole('button', { name: 'Save draft' }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await f.close();
  }
});
test('another coordinator and HR viewer cannot recover, edit or submit a private draft', async ({
  browser,
}, testInfo) => {
  const f = await fixture(browser);
  try {
    const owner = f.actors.owner.page;
    await owner.goto(f.app + '/onboarding/new');
    await owner
      .getByLabel('Full name', { exact: true })
      .fill('Private synthetic draft');
    await owner
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await expect(
      owner.getByRole('heading', { name: 'Basic information', exact: true }),
    ).toBeVisible();
    await owner.waitForURL((url) => !url.pathname.endsWith('/new'));
    const id = new URL(owner.url()).pathname.split('/').pop()!;
    for (const name of ['other', 'viewer']) {
      const actor = f.actors[name];
      await actor.page.goto(f.app + '/onboarding/' + id);
      await expect(
        actor.page.getByText('This onboarding case is unavailable.'),
      ).toBeVisible();
      await expect(
        actor.page.getByRole('button', { name: 'Save draft' }),
      ).toHaveCount(0);
      expect(
        (
          await actor.context.request.get(f.app + '/api/onboarding/' + id)
        ).status(),
      ).toBe(404);
      expect(
        (
          await actor.context.request.post(
            f.app + `/api/onboarding/${id}/fire`,
            {
              headers: {
                origin: f.origin,
                'Idempotency-Key': `${Date.now()}.${randomUUID()}`,
              },
              data: { transition: 'submit', version: 0 },
            },
          )
        ).status(),
      ).toBe(name === 'viewer' ? 403 : 404);
    }
    const directory =
      process.env.E2E_EVIDENCE_DIR ?? testInfo.outputPath('screenshots');
    await mkdir(directory, { recursive: true });
    await f.actors.other.page.screenshot({
      path: path.join(directory, 'onboarding-private-draft-denied.png'),
      fullPage: true,
    });
  } finally {
    await f.close();
  }
});

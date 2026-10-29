import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

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

test('native roles complete a purchasing loop with scoped selectors, editable lines and retained history', async ({
  browser,
}, testInfo) => {
  const app = applicationUrl!.replace(/\/$/, '');
  const origin = new URL(app).origin;
  const contexts: BrowserContext[] = [];
  const errors: string[] = [];
  const screenshotDirectory =
    process.env.E2E_EVIDENCE_DIR ?? testInfo.outputPath('screenshots');
  await mkdir(screenshotDirectory, { recursive: true });
  const snapshot = async (page: Page, name: string) =>
    page.screenshot({
      path: path.join(screenshotDirectory, name),
      fullPage: true,
    });
  const choose = async (page: Page, label: string, name: string) => {
    const control = page.getByRole('combobox', { name: label, exact: true });
    await expect(control).toBeEnabled();
    await control.click();
    await page.getByRole('option', { name, exact: true }).click();
  };
  try {
    const adminContext = await browser.newContext();
    contexts.push(adminContext);
    const admin = await adminContext.newPage();
    await admin.goto(app + '/login');
    await admin.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
    await admin
      .getByLabel('Password', { exact: true })
      .fill(process.env.E2E_PASSWORD!);
    await admin.getByRole('button', { name: 'Sign in', exact: true }).click();
    await admin.waitForURL((url) => !url.pathname.endsWith('/login'));
    const document = await (
      await adminContext.request.get(app + '/api/swagger')
    ).json();
    expect(document.paths['/api/procurement/{id}/fire']).toBeTruthy();
    const actors: Record<
      string,
      { context: BrowserContext; page: Page; id: string; name: string }
    > = {};
    for (const [actor, role] of [
      ['owner', 'applicant'],
      ['reviewer', 'reviewer'],
      ['other', 'applicant'],
      ['otherReviewer', 'reviewer'],
      ['member', ''],
    ] as const) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        locale: 'en-US',
      });
      contexts.push(context);
      const email = `${actor}-${randomUUID()}@procurement.example.test`;
      const name = `Browser ${actor} ${randomUUID().slice(0, 8)}`;
      const password = 'Synthetic-procurement-browser-password';
      const registered = await context.request.post(
        app + '/api/auth/sign-up/email',
        { headers: { origin }, data: { email, name, password } },
      );
      expect(registered.status()).toBe(200);
      const user = (await registered.json()).user;
      if (role) {
        const assigned = await adminContext.request.post(
          app +
            `/api/authorization/permissionSets/procurement-${role}/assignments`,
          {
            headers: { origin },
            data: { id: randomUUID(), subject: { type: 'user', id: user.id } },
          },
        );
        expect(assigned.ok()).toBe(true);
      }
      expect(
        (
          await context.request.post(app + '/api/auth/sign-in/email', {
            headers: { origin },
            data: { email, password },
          })
        ).ok(),
      ).toBe(true);
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      actors[actor] = { context, page, id: user.id, name };
    }
    const owner = actors.owner.page;
    const reviewer = actors.reviewer.page;
    const title = `Browser purchase ${randomUUID().slice(0, 8)}`;
    await owner.goto(app + '/procurement');
    await owner
      .getByRole('button', { name: 'New request', exact: true })
      .click();
    await owner
      .getByRole('textbox', { name: 'Title', exact: true })
      .fill(title);
    await owner
      .getByRole('textbox', { name: 'Search Supplier', exact: true })
      .fill('Atlas');
    await choose(owner, 'Supplier Availability', 'Inactive (not selectable)');
    await choose(owner, 'Supplier Availability', 'Active only');
    await choose(owner, 'Supplier', 'Atlas Office');
    await owner
      .getByRole('textbox', { name: 'Search Reviewer', exact: true })
      .fill(actors.reviewer.name);
    await choose(owner, 'Reviewer', actors.reviewer.name);
    await owner.getByRole('button', { name: 'Add line', exact: true }).click();
    await owner
      .getByRole('textbox', { name: 'Search Material 1', exact: true })
      .fill('Notebook');
    await choose(owner, 'Material 1', 'Notebook');
    await owner
      .getByRole('textbox', { name: 'Quantity', exact: true })
      .fill('2');
    await owner
      .getByRole('textbox', { name: 'Unit price (USD)', exact: true })
      .fill('10.25');
    await expect(owner.getByLabel('Total (USD)')).toHaveText('20.50');
    await owner.getByRole('button', { name: 'Add line', exact: true }).click();
    await owner
      .getByRole('button', { name: 'Remove line', exact: true })
      .nth(1)
      .click();
    await snapshot(owner, 'procurement-draft-desktop.png');
    await owner
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await expect(
      owner.getByRole('heading', { name: 'History', exact: true }),
    ).toBeVisible();
    const id = new URL(owner.url()).pathname.split('/').pop()!;
    console.info('Procurement draft saved and history visible.');
    const detailUrl = app + '/procurement/' + id;
    await owner.getByRole('button', { name: 'Close', exact: true }).click();
    // Closing the top-right drawer control can hover the shell's account menu.
    await owner.keyboard.press('Escape');
    await owner
      .getByRole('textbox', { name: 'Search requests', exact: true })
      .fill(title);
    await expect(
      owner.getByRole('link', { name: title, exact: true }),
    ).toBeVisible();
    // Wait for route focus restoration before dismissing a hovered shell menu.
    await owner.keyboard.press('Escape');
    await expect(owner.getByRole('menu')).toHaveCount(0);
    await snapshot(owner, 'procurement-list.png');
    await owner.getByRole('link', { name: title, exact: true }).click();
    console.info('Procurement draft reopened from the filtered list.');
    await expect(owner.getByLabel('Total (USD)')).toHaveText('20.50');
    for (const actor of ['other', 'otherReviewer', 'member'])
      expect(
        (
          await actors[actor].context.request.get(
            app + '/api/procurement/' + id,
          )
        ).ok(),
      ).toBe(false);
    await expect(
      owner.getByRole('button', { name: 'Approve', exact: true }),
    ).toHaveCount(0);
    await owner.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(
      owner.getByRole('textbox', { name: 'Title', exact: true }),
    ).toBeDisabled();
    await reviewer.goto(detailUrl);
    console.info('Procurement submitted; reviewer opened the request.');
    await expect(
      reviewer.getByRole('button', { name: 'Approve', exact: true }),
    ).toBeVisible();
    await expect(
      reviewer.getByRole('button', { name: 'Save draft', exact: true }),
    ).toHaveCount(0);
    await snapshot(reviewer, 'procurement-submitted-review.png');
    await reviewer.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(
      reviewer.getByRole('button', { name: 'Approve', exact: true }),
    ).toHaveCount(0);
    await owner.reload();
    console.info('Procurement rejected; applicant reloaded the request.');
    await expect(
      owner.getByRole('textbox', { name: 'Title', exact: true }),
    ).toBeEnabled();
    await owner
      .getByRole('textbox', { name: 'Quantity', exact: true })
      .fill('3');
    await owner
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await expect(owner.getByLabel('Total (USD)')).toHaveText('30.75');
    await owner.getByRole('button', { name: 'Submit', exact: true }).click();
    await reviewer.reload();
    await reviewer
      .getByRole('button', { name: 'Approve', exact: true })
      .click();
    await expect(
      reviewer.getByRole('button', { name: 'Approve', exact: true }),
    ).toHaveCount(0);
    await expect(
      reviewer.getByRole('textbox', { name: 'Title', exact: true }),
    ).toBeDisabled();
    await snapshot(reviewer, 'procurement-approved-history.png');
    console.info('Procurement approved after resubmission.');
    await reviewer.setViewportSize({ width: 390, height: 844 });
    await snapshot(reviewer, 'procurement-mobile.png');
    expect(
      await reviewer.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  } catch (error) {
    for (const [index, context] of contexts.entries()) {
      const page = context.pages()[0];
      if (page && !page.isClosed())
        await snapshot(page, `procurement-failure-${index}.png`).catch(
          () => undefined,
        );
    }
    throw error;
  } finally {
    await Promise.allSettled(contexts.map((c) => c.close()));
  }
});

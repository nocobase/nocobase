import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const deliveryTimeoutMs = Number(
  process.env.MAIL_E2E_DELIVERY_TIMEOUT_MS ?? 90_000,
);
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  test.skip(
    !adminEmail || !adminPassword,
    'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required.',
  );
  await signIn(page);
});

test('covers Mail routes, account metadata, and provider connection forms', async ({
  page,
}, testInfo) => {
  const routes = [
    ['MAIL-ROUTE-001-accounts', 'dev/mail/accounts', /Mail accounts/iu],
    ['MAIL-ROUTE-001-center', 'dev/mail/center', /Mail center/iu],
    ['MAIL-ROUTE-001-management', 'dev/mail/management', /Mail management/iu],
    ['MAIL-ROUTE-001-send', 'dev/mail/send', /Compose mail/iu],
    ['MAIL-ROUTE-001-logs', 'dev/mail/logs', /Mail logs/iu],
    [
      'MAIL-ROUTE-001-settings',
      'settings/mail/accounts',
      /Mail account management/iu,
    ],
  ] as const;

  for (const [caseId, path, heading] of routes) {
    await test.step(caseId, async () => {
      await gotoPage(page, path);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await capture(page, testInfo, caseId);
    });
  }

  await test.step('MAIL-ACCOUNT-001 and MAIL-SCOPE-001', async () => {
    await gotoPage(page, 'dev/mail/accounts');
    const main = page.locator('main');
    await expect(
      main.getByRole('heading', { name: /Connected accounts/iu }),
    ).toBeVisible();
    await expect(main).toContainText(/Gmail/iu);
    await expect(main).toContainText(/Microsoft 365/iu);
    await expect(main).toContainText(/IMAP \/ SMTP/iu);

    const addresses = await findAccountAddresses(page);
    expect(addresses.length).toBeGreaterThanOrEqual(3);
    await capture(page, testInfo, 'MAIL-ACCOUNT-001-connected-accounts');
  });

  await test.step('MAIL-ACCOUNT-003, MAIL-ACCOUNT-005, and MAIL-ACCOUNT-006', async () => {
    const connect = page.getByRole('button', { name: /Connect account/iu });
    await connect.click();
    const dialog = page.getByRole('dialog', { name: /Add mail account/iu });
    await expect(dialog).toBeVisible();

    const accountType = dialog.getByRole('combobox', {
      name: /Account type/iu,
    });
    const providerOptions = await getSelectOptions(accountType);
    const credentialsProvider = providerOptions.find((option) =>
      /IMAP \/ SMTP/iu.test(option.label),
    );
    const oauthProvider = providerOptions.find((option) =>
      /^Gmail/iu.test(option.label),
    );
    expect(credentialsProvider).toBeDefined();
    expect(oauthProvider).toBeDefined();

    await accountType.selectOption(credentialsProvider!.value);
    await expect(dialog.locator('input[type="password"]')).toHaveCount(1);
    await expect(dialog.getByLabel(/Email address/iu)).toBeVisible();
    await expect(dialog.getByLabel(/Username/iu)).toBeVisible();
    await expect(dialog.getByLabel(/Password/iu)).toBeVisible();
    await capture(page, testInfo, 'MAIL-ACCOUNT-003-credentials-form');

    await accountType.selectOption(oauthProvider!.value);
    await expect(dialog.locator('input[type="password"]')).toHaveCount(0);
    await capture(page, testInfo, 'MAIL-ACCOUNT-005-oauth-form');
    await dialog.getByRole('button', { name: /Close/iu }).click();
  });
});

test('covers Mail center browsing, search, folders, pagination, and detail view', async ({
  page,
}, testInfo) => {
  await gotoPage(page, 'dev/mail/center');
  const accountSelect = page.getByRole('combobox', { name: 'Account' });
  await expect(accountSelect).toBeVisible();
  const accountOptions = await accountSelect
    .locator('option')
    .allTextContents();
  expect(accountOptions.length).toBeGreaterThanOrEqual(4);

  for (const folder of [
    'Inbox',
    'Sent',
    'Drafts',
    'Trash',
    'Spam',
    'Archive',
  ]) {
    await expect(page.getByRole('button', { name: folder })).toBeVisible();
  }
  await capture(page, testInfo, 'MAIL-CENTER-003-folders');

  await test.step('MAIL-CENTER-006 and MAIL-CENTER-007', async () => {
    const search = page.getByRole('textbox', { name: 'Search mail' });
    await search.fill(`noco-e2e-no-match-${Date.now()}`);
    await page.waitForTimeout(500);
    await expect(page.getByRole('region', { name: 'Mail' })).toBeVisible();
    await capture(page, testInfo, 'MAIL-CENTER-006-search');
    await search.fill('');
    await page.waitForTimeout(500);
  });

  await test.step('MAIL-CENTER-008 and MAIL-CENTER-010', async () => {
    const mailRegion = page.getByRole('region', { name: 'Mail' });
    const messages = mailRegion.getByRole('button');
    expect(await messages.count()).toBeGreaterThan(0);

    const next = page.getByRole('button', { name: 'Next page' });
    if (await next.isEnabled()) {
      await next.click();
      await expect(
        page.getByRole('button', { name: 'Previous page' }),
      ).toBeEnabled();
      await capture(page, testInfo, 'MAIL-CENTER-008-next-page');
      await page.getByRole('button', { name: 'Previous page' }).click();
    }

    await messages.first().click();
    const replyActions = page.getByRole('button', {
      name: /Reply|Forward/iu,
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (
        await replyActions
          .first()
          .isVisible()
          .catch(() => false)
      )
        break;
      await page.waitForTimeout(750);
      await messages.first().click();
    }
    await expect(replyActions.first()).toBeVisible({ timeout: 20_000 });
    await capture(page, testInfo, 'MAIL-CENTER-010-message-detail');
  });
});

test('covers label, template, and signature management entry points', async ({
  page,
}, testInfo) => {
  await gotoPage(page, 'dev/mail/accounts');

  await test.step('MAIL-ACCOUNT-019 and MAIL-ACCOUNT-020 templates', async () => {
    await page.getByRole('button', { name: 'Templates' }).click();
    const dialog = page.getByRole('dialog', { name: /Template management/iu });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /New template/iu }),
    ).toBeVisible();
    await capture(page, testInfo, 'MAIL-ACCOUNT-019-templates');
    await dialog.getByRole('button', { name: 'Close' }).click();
    await waitForSheetToClose(page);
    await gotoPage(page, 'dev/mail/accounts');
  });

  await test.step('MAIL-ACCOUNT-019 and MAIL-SIGNATURE-001 signatures', async () => {
    await page.getByRole('button', { name: 'Signatures' }).click();
    const dialog = page.getByRole('dialog', { name: /Signature management/iu });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /New signature/iu }),
    ).toBeVisible();
    await capture(page, testInfo, 'MAIL-SIGNATURE-001-signatures');
    await dialog.getByRole('button', { name: 'Close' }).click();
    await waitForSheetToClose(page);
    await gotoPage(page, 'dev/mail/accounts');
  });

  await test.step('MAIL-ACCOUNT-019 and MAIL-LABEL-001 labels', async () => {
    await page.getByRole('button', { name: 'Labels' }).click();
    const dialog = page.getByRole('dialog', { name: /Label management/iu });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /New label/iu }),
    ).toBeVisible();
    await expect(dialog.getByLabel('Label name')).toBeVisible();
    await capture(page, testInfo, 'MAIL-LABEL-001-labels');
    await dialog.getByRole('button', { name: 'Close' }).click();
  });
});

test('sends and receives messages between the connected providers', async ({
  page,
}, testInfo) => {
  test.setTimeout(10 * 60 * 1000);
  await gotoPage(page, 'dev/mail/accounts');
  const addresses = await findAccountAddresses(page);
  const pairs = providerPairs(addresses);
  expect(pairs.length).toBeGreaterThanOrEqual(2);

  for (const [from, to, label] of pairs) {
    const subject = `NocoBase E2E ${label} ${Date.now()}`;
    const body = `Headless Mail acceptance test ${subject}`;

    await test.step(`MAIL-${label}-send`, async () => {
      await composeAndSend(page, from, to, subject, body, testInfo, label);
    });

    await test.step(`MAIL-${label}-receive`, async () => {
      await requestSync(page, to);
      await waitForReceived(page, to, subject);
      await capture(page, testInfo, `MAIL-${label}-received`);
    });
  }

  await test.step('MAIL-USER-SENDLOG-001 and MAIL-USER-SYNCLOG-001', async () => {
    await gotoPage(page, 'dev/mail/logs/send');
    await expect(page.locator('main')).toContainText(/NocoBase E2E/iu);
    await capture(page, testInfo, 'MAIL-USER-SENDLOG-001');
    await gotoPage(page, 'dev/mail/logs/sync');
    await expect(page.locator('main')).toContainText(/Completed|完成/iu);
    await capture(page, testInfo, 'MAIL-USER-SYNCLOG-001');
  });
});

async function signIn(page: Page): Promise<void> {
  await page.goto('login', { waitUntil: 'domcontentloaded' });
  const inputs = page.locator('input');
  await inputs.nth(0).fill(adminEmail!);
  await inputs.nth(1).fill(adminPassword!);
  await page.getByRole('button', { name: /Sign in/iu }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    timeout: 30_000,
  });
}

async function gotoPage(page: Page, path: string): Promise<void> {
  await page.goto(path.replace(/^\/+/, ''), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
  await page.addStyleTag({
    content:
      '#agent-annotations-root { display: none !important; pointer-events: none !important; }',
  });
  await page.waitForTimeout(500);
}

async function capture(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fullPage = true,
): Promise<void> {
  const path = testInfo.outputPath(`${slug(name)}.png`);
  await page.screenshot({ path, fullPage });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

async function findAccountAddresses(page: Page): Promise<string[]> {
  const text = await page.locator('main').innerText();
  return [...new Set(text.match(emailPattern) ?? [])];
}

function providerPairs(
  addresses: readonly string[],
): Array<[string, string, string]> {
  const outlook = addresses.find((address) => /@outlook\./iu.test(address));
  const gmail = addresses.find((address) => /@gmail\./iu.test(address));
  const smtp = addresses.find((address) => /@163\./iu.test(address));
  return [
    outlook && gmail ? [outlook, gmail, 'OUTLOOK-GMAIL'] : undefined,
    gmail && smtp ? [gmail, smtp, 'GMAIL-SMTP'] : undefined,
    smtp && outlook ? [smtp, outlook, 'SMTP-OUTLOOK'] : undefined,
  ].filter((pair): pair is [string, string, string] => pair !== undefined);
}

async function composeAndSend(
  page: Page,
  from: string,
  to: string,
  subject: string,
  body: string,
  testInfo: TestInfo,
  label: string,
): Promise<void> {
  await gotoPage(page, 'dev/mail/send');
  const fromSelect = page.getByRole('combobox', { name: 'From address' });
  const fromOptions = await getSelectOptions(fromSelect);
  const fromOption = fromOptions.find((option) => option.label.includes(from));
  expect(fromOption).toBeDefined();
  await fromSelect.selectOption(fromOption!.value);

  const toInput = page.getByRole('textbox', { name: 'To' });
  const subjectInput = page.getByRole('textbox', { name: 'Subject' });
  const editor = page.getByRole('textbox', { name: 'Message body' });
  await toInput.fill(to);
  await toInput.press('Tab');
  await subjectInput.fill(subject);
  await editor.fill(body);

  if (label === 'OUTLOOK-GMAIL') {
    const attachment = page.locator('input[type="file"][multiple]');
    await attachment.setInputFiles({
      name: 'mail-e2e.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Mail E2E attachment'),
    });
    await expect(page.getByText('mail-e2e.txt')).toBeVisible();
  }

  const send = page.getByRole('button', { name: /^Send$/iu });
  await expect(send).toBeEnabled();
  await capture(page, testInfo, `MAIL-${label}-before-send`);
  await send.click();
  await expect(subjectInput).toHaveValue('', { timeout: 90_000 });
  await capture(page, testInfo, `MAIL-${label}-after-send`);
}

async function requestSync(page: Page, address: string): Promise<void> {
  await gotoPage(page, 'dev/mail/accounts');
  const row = page.locator('tr').filter({ hasText: address }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Sync' }).click();
  await page.waitForTimeout(1_000);
}

async function selectAccount(page: Page, address: string): Promise<void> {
  const accountSelect = page.getByRole('combobox', { name: 'Account' });
  const accountOption = accountSelect.locator('option').filter({
    hasText: address,
  });
  await expect(accountOption).toHaveCount(1, { timeout: 30_000 });
  await accountSelect.selectOption({ label: address });
}

async function waitForReceived(
  page: Page,
  address: string,
  subject: string,
): Promise<void> {
  const deadline = Date.now() + deliveryTimeoutMs;
  const subjectPattern = new RegExp(escapeRegExp(subject), 'u');

  while (Date.now() < deadline) {
    await gotoPage(page, 'dev/mail/center');
    await selectAccount(page, address);
    const search = page.getByRole('textbox', { name: 'Search mail' });
    await search.fill(subject);
    await page.waitForTimeout(1_000);
    if (await page.getByRole('button', { name: subjectPattern }).count())
      return;
    await page.waitForTimeout(4_000);
  }

  throw new Error(`Timed out waiting for ${subject} in ${address}.`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

async function getSelectOptions(
  select: Locator,
): Promise<Array<{ label: string; value: string }>> {
  const options = await select.locator('option').all();
  return Promise.all(
    options.map(async (option) => ({
      label: (await option.textContent())?.trim() ?? '',
      value: (await option.getAttribute('value')) ?? '',
    })),
  );
}

async function waitForSheetToClose(page: Page): Promise<void> {
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
}

function slug(value: string): string {
  return value.replace(/[^a-z0-9-]+/giu, '-').replace(/^-|-$/gu, '');
}

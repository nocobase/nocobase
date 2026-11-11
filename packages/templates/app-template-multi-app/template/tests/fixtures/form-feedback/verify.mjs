import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
/* global document */
// Run only against an authorized isolated application with the equipment fixture installed.
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [base, output, name = 'application', legacy] = process.argv.slice(2);
if (
  !base ||
  !output ||
  !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/main\/$/.test(base)
)
  throw new Error(
    'Supply the isolated server entry URL and an evidence directory.',
  );
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const failures = [];
page.on('pageerror', (error) => failures.push(error.message));
await page.goto(`${base}login`, { waitUntil: 'domcontentloaded' });
if (legacy !== '--legacy') {
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('Username or email')).toBeFocused();
  await expect(page.getByLabel('Username or email')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page
    .getByLabel('Username or email')
    .fill(process.env.TEST_ADMIN_USERNAME ?? 'nocobase');
  await page
    .getByLabel('Password', { exact: true })
    .fill('incorrect-fixture-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('form [role="alert"]').first()).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue(
    'incorrect-fixture-password',
  );
  await page.screenshot({
    path: join(output, `${name}-native-login.png`),
    fullPage: true,
    animations: 'disabled',
  });
}
await page
  .getByLabel('Username or email')
  .fill(process.env.TEST_ADMIN_USERNAME ?? 'nocobase');
await page
  .getByLabel('Password', { exact: true })
  .fill(process.env.TEST_ADMIN_PASSWORD ?? 'admin123');
await page.getByRole('button', { name: 'Sign in', exact: true }).click();
await expect(page.getByLabel('Username or email')).not.toBeVisible();

async function open(container = 'page') {
  await page.goto(`${base}equipment`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('retained-record')).toContainText(
    'Legacy camera',
  );
  if (container !== 'page') {
    await page.getByLabel('Container', { exact: true }).selectOption(container);
    await expect(page).toHaveURL(
      new RegExp(
        container === 'detail-edit'
          ? '/equipment/retained/edit$'
          : `/equipment/${container}$`,
      ),
    );
    await expect(
      page.getByLabel('Equipment name', { exact: true }),
    ).toBeVisible();
  }
}
async function save() {
  await page.getByRole('button', { name: 'Save request', exact: true }).click();
}
async function inline(locator) {
  await expect(locator).toHaveAttribute('aria-invalid', 'true');
  const ids = (await locator.getAttribute('aria-describedby')).split(/\s+/);
  expect(
    await page.evaluate(
      (ids) => ids.every((id) => document.getElementById(id)),
      ids,
    ),
  ).toBe(true);
}
async function delayedRequest(action) {
  let release;
  let reached;
  let complete;
  const completed = new Promise((resolve) => {
    complete = resolve;
  });
  const reachedPromise = new Promise((resolve) => {
    reached = resolve;
  });
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/equipmentFixture', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    reached();
    await gate;
    await route.continue();
    complete();
  });
  await save();
  await reachedPromise;
  await action();
  release();
  await completed;
  await page.unroute('**/api/equipmentFixture');
}

await open();
const before = await page.getByTestId('retained-record').innerText();
await writeFile(join(output, `${name}-record.json`), before);
if (legacy === '--legacy') {
  await save();
  await expect(page.getByRole('alert')).toHaveText('Unable to save equipment.');
  await expect(page.locator('#row-camera')).toHaveCount(0);
  await page.screenshot({
    path: join(output, `${name}-before.png`),
    fullPage: true,
    animations: 'disabled',
  });
  await browser.close();
  console.log(`${name}: legacy failure reproduced; record captured`);
  process.exit(0);
}

const checked = [
  'native template sign-in validation and request failure preserve input',
];
for (const container of ['page', 'dialog', 'drawer', 'detail-edit']) {
  await open(container);
  const routeBeforeFailure = page.url();
  const title = page.getByLabel('Equipment name', { exact: true });
  await title.fill('');
  await save();
  await expect(title).toBeFocused();
  await inline(title);
  expect(await title.getAttribute('aria-describedby')).toContain('name-help');
  await title.fill('Retained equipment draft');
  await page.getByLabel('Attachment', { exact: true }).setInputFiles({
    name: 'equipment.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('attachment fixture'),
  });
  await save();
  await expect(page.locator('#row-camera')).toBeFocused();
  await inline(page.locator('#row-camera'));
  await expect(
    page.getByRole('tab', { name: 'Items', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('button', { name: 'Borrowed items', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(title).toHaveValue('Retained equipment draft');
  expect(
    await page
      .getByLabel('Attachment', { exact: true })
      .evaluate((input) => input.files[0]?.name),
  ).toBe('equipment.txt');
  await page.locator('#row-camera').fill('Corrected camera');
  await expect(page.locator('#row-camera')).toBeFocused();
  await expect(page.locator('#row-camera')).not.toHaveAttribute('aria-invalid');
  await page.screenshot({
    path: join(output, `${name}-${container}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  expect(page.url()).toBe(routeBeforeFailure);
  checked.push(
    `${container}: native errors, region reveal, inline association, scroll/focus, input and file retention`,
  );
}

await open();
await delayedRequest(() =>
  page.getByRole('button', { name: 'Reorder rows', exact: true }).click(),
);
await expect(page.locator('#row-tripod')).toBeFocused();
await inline(page.locator('#row-camera'));
checked.push('request snapshot follows stable rows after reordering');
await open();
await delayedRequest(() =>
  page.getByRole('button', { name: 'Delete camera row', exact: true }).click(),
);
await expect(page.locator('#row-tripod')).toBeFocused();
await expect(page.locator('#row-camera')).toHaveCount(0);
checked.push('deleted rows do not receive response errors');
await open();
await page.getByRole('tab', { name: 'Items', exact: true }).click();
await page.getByRole('button', { name: 'Borrowed items', exact: true }).click();
await delayedRequest(() =>
  page.locator('#row-camera').fill('Edited while request was pending'),
);
await expect(page.locator('#row-tripod')).toBeFocused();
await expect(page.locator('#row-camera')).not.toHaveAttribute('aria-invalid');
checked.push('edits during a request discard stale field errors');

await open();
await page.route('**/api/equipmentFixture', (route) =>
  route.request().method() === 'POST'
    ? route.abort('failed')
    : route.continue(),
);
await page.getByLabel('Response', { exact: true }).selectOption('success');
await save();
await expect(page.getByRole('alert')).toBeFocused();
await expect(page.getByRole('alert')).toContainText('Unable to connect');
await page.unroute('**/api/equipmentFixture');
checked.push(
  'aborted HTTP transport preserves input and reports a connection failure',
);
for (const mode of ['unknown', 'denied', 'network']) {
  await open();
  await page.getByLabel('Response', { exact: true }).selectOption(mode);
  await save();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Equipment name', { exact: true })).toHaveValue(
    'Equipment draft',
  );
  await expect(page.locator('body')).not.toContainText('Private developer');
  await expect(page.locator('body')).not.toContainText('Secret salary');
  checked.push(`${mode}: safe form error and retained input`);
}
await open();
await page
  .getByRole('button', { name: 'Toggle field access', exact: true })
  .click();
await save();
await expect(page.getByRole('alert')).toBeFocused();
await expect(page.locator('#row-camera')).toHaveCount(0);
await expect(page.getByRole('alert')).not.toContainText('Camera item');
await expect(
  page.getByRole('tab', { name: 'Details', exact: true }),
).toHaveAttribute('aria-selected', 'true');
checked.push('inaccessible fields do not appear or open their region');
await open();
await page
  .getByRole('button', { name: 'Toggle disabled', exact: true })
  .click();
await save();
await expect(page.getByRole('alert')).toBeFocused();
await page.keyboard.press('Tab');
await expect(page.getByLabel('Equipment name', { exact: true })).toBeFocused();
checked.push('disabled fields fall back to a keyboard-accessible safe message');
await open();
await page.getByLabel('Response', { exact: true }).selectOption('business');
await save();
await expect(page.getByLabel('Department', { exact: true })).toBeFocused();
await inline(page.getByLabel('Department', { exact: true }));
await page.getByLabel('Department', { exact: true }).fill('Operations');
await page.getByLabel('Response', { exact: true }).selectOption('success');
await save();
await expect(page.getByRole('status')).toHaveText('Saved; workflow submitted.');
await expect(page.getByRole('alert')).toHaveCount(0);
await expect(page.getByTestId('workflow-status')).toContainText('submitted');
const submittedId = (
  await page.getByTestId('workflow-status').innerText()
).split(':')[0];
await page
  .getByRole('button', { name: 'Approve request', exact: true })
  .click();
await expect(page.getByTestId('workflow-status')).toContainText('approved');
const persisted = await (
  await page.request.get(`${base}api/equipmentFixture`)
).json();
expect(persisted.requests.find((row) => row.id === submittedId)?.workflow).toBe(
  'approved',
);
expect(
  persisted.history
    .filter((row) => row.recordId === submittedId)
    .map((row) => row.event)
    .sort(),
).toEqual(['approved', 'submitted']);
await page.screenshot({
  path: join(output, `${name}-approved-workflow.png`),
  fullPage: true,
  animations: 'disabled',
});
checked.push(
  'real equipment submission and approval persist with both history events',
);
checked.push(
  'trusted business copy and successful retry clear obsolete errors',
);
await open();
expect(await page.getByTestId('retained-record').innerText()).toBe(before);
await expect(page.getByTestId('custom-style')).toHaveCSS(
  'font-family',
  /serif/,
);
const restricted = await browser.newContext();
const member = {
  email: 'restricted@example.test',
  password: 'fixture-member-password',
};
const nativeHeaders = { origin: new URL(base).origin };
let signedIn = await restricted.request.post(`${base}api/auth/sign-in/email`, {
  headers: nativeHeaders,
  data: member,
});
if (!signedIn.ok()) {
  const registered = await restricted.request.post(
    `${base}api/auth/sign-up/email`,
    {
      headers: nativeHeaders,
      data: {
        ...member,
        username: 'restricted_fixture',
        name: 'Restricted fixture member',
      },
    },
  );
  expect(registered.ok()).toBe(true);
  signedIn = await restricted.request.post(`${base}api/auth/sign-in/email`, {
    headers: nativeHeaders,
    data: member,
  });
}
expect(signedIn.ok()).toBe(true);
const deniedRead = await restricted.request.get(`${base}api/equipmentFixture`);
expect(deniedRead.status()).toBe(403);
expect(await deniedRead.text()).not.toContain('Legacy camera');
const deniedWrite = await restricted.request.post(
  `${base}api/equipmentFixture`,
  {
    headers: nativeHeaders,
    data: {
      mode: 'success',
      name: 'Denied request',
      department: 'Operations',
      items: [],
      attachment: '',
    },
  },
);
expect(deniedWrite.status()).toBe(403);
const restrictedPage = await restricted.newPage();
await restrictedPage.goto(`${base}equipment`, {
  waitUntil: 'domcontentloaded',
});
await expect(
  restrictedPage.getByRole('heading', { name: 'Access denied', exact: true }),
).toBeVisible();
await expect(
  restrictedPage.getByLabel('Equipment name', { exact: true }),
).toHaveCount(0);
await restricted.close();
checked.push(
  'native ordinary identity is denied both business reads and writes without record disclosure',
);
expect(failures).toEqual([]);
await writeFile(
  join(output, `${name}-checks.json`),
  JSON.stringify(
    { base, checked, recordPreserved: true, pageErrors: failures },
    null,
    2,
  ),
);
await browser.close();
console.log(
  `${name}: ${checked.length} scenario groups passed; business record and custom style preserved`,
);

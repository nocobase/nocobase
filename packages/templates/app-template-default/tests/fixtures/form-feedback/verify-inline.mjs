import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { log } from 'node:console';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium, expect } = require('@playwright/test');
const [base, out, name] = process.argv.slice(2);
if (!/^http:\/\/127\.0\.0\.1:\d+\/main\/$/.test(base ?? ''))
  throw new Error('Supply the isolated application entry.');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
const shot = (point) =>
  page.screenshot({
    path: path.join(out, `${name}-${point}.png`),
    fullPage: true,
  });
try {
  await page.goto(base + 'login');
  await page
    .getByLabel('Username or email')
    .fill(process.env.TEST_ADMIN_USERNAME ?? 'nocobase');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.TEST_ADMIN_PASSWORD ?? 'admin123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('Username or email')).not.toBeVisible();
  await page.goto(base + 'equipment-validation');
  const group = page.getByRole('form', {
    name: 'Equipment group',
    exact: true,
  });
  const save = group.getByRole('button', {
    name: 'Save equipment group',
    exact: true,
  });
  const entry = group.getByRole('button', {
    name: 'Equipment group',
    exact: true,
  });
  await save.click();
  await expect(entry).toBeFocused();
  await expect(group.getByRole('alert')).toHaveCount(0);
  await expect(group.getByRole('list')).toHaveCount(0);
  const errorId = await entry.getAttribute('aria-describedby');
  await expect(page.locator(`[id="${errorId}"]`)).toHaveText(
    'Add at least two equipment items.',
  );
  await save.click();
  await expect(
    group.getByText('Add at least two equipment items.', { exact: true }),
  ).toHaveCount(1);
  await expect(group.getByLabel('Equipment item 1')).toHaveValue('Camera');
  await shot('group-inline');
  await entry.click();
  await save.click();
  await expect(group.getByRole('status')).toHaveText('Equipment group saved.');
  await expect(group.locator('[data-form-feedback-error]')).toHaveCount(0);
  const unique = page.getByLabel('Unique name', { exact: true });
  await page
    .getByRole('button', { name: 'Save unique name', exact: true })
    .click();
  const controlled = page.getByRole('form', {
    name: 'Unique equipment',
    exact: true,
  });
  await expect(unique).toBeFocused();
  await expect(controlled.getByRole('alert')).toHaveCount(0);
  await expect(
    controlled.getByText('Choose a unique equipment name.', { exact: true }),
  ).toHaveCount(1);
  await unique.fill('Retained correction');
  await expect(
    controlled.getByText('Choose a unique equipment name.', { exact: true }),
  ).toHaveCount(0);
  await expect(unique).toHaveAttribute('aria-invalid', 'false');
  await expect(unique).toHaveAttribute('aria-describedby', 'updated-help');
  await expect(unique).toHaveValue('Retained correction');
  await shot('corrected-inline');
  await page.goto(base + 'equipment/drawer');
  const draft = page.getByLabel('Equipment name', { exact: true });
  await draft.fill('Retained equipment draft');
  const file = page.getByLabel('Attachment', { exact: true });
  await file.setInputFiles({
    name: 'equipment.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('retained equipment'),
  });
  const submit = page.getByRole('button', {
    name: 'Save request',
    exact: true,
  });
  await submit.click();
  await expect(page.locator('#row-camera')).toBeFocused();
  await expect(
    page.getByRole('tab', { name: 'Items', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('button', { name: 'Borrowed items', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('[data-form-feedback-error]')).toHaveCount(2);
  expect(page.url()).toBe(base + 'equipment/drawer');
  await page.locator('#row-camera').fill('Corrected camera');
  await expect(page.locator('[data-form-feedback-error]')).toHaveCount(1);
  await expect(page.locator('#row-tripod')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(draft).toHaveValue('Retained equipment draft');
  expect(await file.evaluate((input) => input.files[0].name)).toBe(
    'equipment.txt',
  );
  await shot('drawer-inline');
  await page.locator('#row-tripod').fill('Corrected tripod');
  await expect(page.locator('[data-form-feedback-error]')).toHaveCount(0);
  await page.getByLabel('Response', { exact: true }).selectOption('success');
  await submit.click();
  await expect(page.getByRole('status')).toHaveText(
    'Saved; workflow submitted.',
  );
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Response', { exact: true }).selectOption('unknown');
  await submit.click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Unable to save.');
  await expect(page.getByRole('alert').getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('alert')).not.toContainText('Private');
  await shot('form-error');
  await page.getByLabel('Response', { exact: true }).selectOption('network');
  await submit.click();
  await expect(page.getByRole('alert')).toContainText('Unable to connect.');
  await expect(draft).toHaveValue('Retained equipment draft');
  await page.getByLabel('Response', { exact: true }).selectOption('denied');
  await submit.click();
  await expect(page.getByRole('alert')).toContainText('current access');
  await page.getByLabel('Response', { exact: true }).selectOption('structured');
  await page
    .getByRole('button', { name: 'Toggle disabled', exact: true })
    .click();
  await submit.click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('alert')).toContainText('Unable to save.');
  await expect(page.getByRole('alert').getByRole('button')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  fs.writeFileSync(
    path.join(out, `${name}-inline-checks.json`),
    JSON.stringify(
      {
        base,
        checked: [
          'array-level error is inline only and first editable entry focused',
          'repeated submission and successful group retry clean errors',
          'controlled field reason, correction and help association',
          'real drawer remains open and regions reveal before row focus',
          'row reasons are inline only and clear independently',
          'draft, file and successful request retry retained',
          'unknown, network and permission failures keep safe form copy',
          'unavailable field focus uses a safe accessible fallback',
        ],
        pageErrors,
      },
      null,
      2,
    ),
  );
  log(`${name}: inline feedback browser checks passed`);
} finally {
  await browser.close();
}

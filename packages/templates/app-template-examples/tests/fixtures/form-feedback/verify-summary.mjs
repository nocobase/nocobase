import { createRequire } from 'node:module';
import fs from 'node:fs';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { log } from 'node:console';
import path from 'node:path';
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
  const summary = group.getByRole('alert');
  const groupLink = summary.getByRole('button', {
    name: 'Equipment group: Add at least two equipment items.',
    exact: true,
  });
  await expect(groupLink).toBeVisible();
  await expect(
    summary.getByText('Check the highlighted fields and try again.', {
      exact: true,
    }),
  ).toHaveCount(1);
  await save.click();
  await expect(summary.getByRole('button')).toHaveCount(1);
  await groupLink.focus();
  await page.keyboard.press('Enter');
  await expect(entry).toBeFocused();
  await expect(group.getByLabel('Equipment item 1')).toHaveValue('Camera');
  const errorId = await entry.getAttribute('aria-describedby');
  await expect(page.locator(`[id="${errorId}"]`)).toHaveText(
    'Add at least two equipment items.',
  );
  await shot('group-summary');
  await entry.click();
  await save.click();
  await expect(group.getByRole('status')).toHaveText('Equipment group saved.');
  await expect(summary).toHaveCount(0);
  const unique = page.getByLabel('Unique name', { exact: true });
  await page
    .getByRole('button', { name: 'Save unique name', exact: true })
    .click();
  const controlled = page.getByRole('form', {
    name: 'Unique equipment',
    exact: true,
  });
  await expect(
    controlled.getByRole('alert').getByRole('button', {
      name: 'Unique name: Choose a unique equipment name.',
      exact: true,
    }),
  ).toBeVisible();
  await unique.fill('Retained correction');
  await expect(controlled.getByRole('alert')).toHaveCount(0);
  await expect(unique).toHaveAttribute('aria-invalid', 'false');
  await expect(unique).toHaveAttribute('aria-describedby', 'updated-help');
  await expect(unique).toHaveValue('Retained correction');
  await shot('corrected-summary');
  await page.goto(base + 'equipment');
  await page
    .getByLabel('Equipment name', { exact: true })
    .fill('Retained equipment draft');
  await page.getByLabel('Attachment', { exact: true }).setInputFiles({
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
  const rowsSummary = page.getByRole('alert');
  await expect(
    rowsSummary.getByRole('button', {
      name: 'Tripod item: Check this borrowed item.',
      exact: true,
    }),
  ).toBeVisible();
  await page.locator('#row-camera').fill('Corrected camera');
  await expect(rowsSummary.getByRole('button')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Details', exact: true }).click();
  await page
    .getByRole('button', { name: 'Borrowed items', exact: true })
    .click();
  const rowLink = rowsSummary.getByRole('button', {
    name: 'Tripod item: Check this borrowed item.',
    exact: true,
  });
  await rowLink.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('tab', { name: 'Items', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('button', { name: 'Borrowed items', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#row-tripod')).toBeFocused();
  await expect(page.getByLabel('Equipment name', { exact: true })).toHaveValue(
    'Retained equipment draft',
  );
  expect(
    await page
      .getByLabel('Attachment', { exact: true })
      .evaluate((input) => input.files[0].name),
  ).toBe('equipment.txt');
  await shot('row-summary');
  await submit.click();
  await expect(rowsSummary.getByRole('button')).toHaveCount(2);
  await submit.click();
  await expect(rowsSummary.getByRole('button')).toHaveCount(2);
  await page.locator('#row-camera').fill('Corrected camera again');
  await page.locator('#row-tripod').fill('Corrected tripod');
  await expect(rowsSummary).toHaveCount(0);
  await page.getByLabel('Response', { exact: true }).selectOption('unknown');
  await submit.click();
  await expect(rowsSummary.getByRole('button')).toHaveCount(0);
  await expect(rowsSummary).toContainText('Unable to save.');
  await expect(rowsSummary).not.toContainText('private');
  await page.getByLabel('Response', { exact: true }).selectOption('structured');
  await page
    .getByRole('button', { name: 'Toggle field access', exact: true })
    .click();
  await submit.click();
  await expect(rowsSummary.getByRole('button')).toHaveCount(0);
  await expect(rowsSummary).not.toContainText('Tripod');
  expect(pageErrors).toEqual([]);
  fs.writeFileSync(
    path.join(out, `${name}-summary-checks.json`),
    JSON.stringify(
      {
        base,
        checked: [
          'named array summary with one instruction',
          'repeat submission does not accumulate',
          'keyboard group focus and error association',
          'controlled correction clears summary and keeps help/input',
          'row summary includes trusted correction reason',
          'keyboard opens tab and collapse before row focus',
          'file and draft preserved',
          'unknown and inaccessible errors stay safe at form level',
        ],
        pageErrors,
      },
      null,
      2,
    ),
  );
  log(`${name}: summary browser checks passed`);
} finally {
  await browser.close();
}

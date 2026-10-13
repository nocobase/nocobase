import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { HEADERS, PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import { test, expect, url } from './support/fixtures.ts';

test.use({ user: 'admin' });

test('reports corrupt workspaces through the protocol and shows English diagnostics', async ({
  page,
  context,
  api,
}) => {
  await context.addInitScript(
    "localStorage.setItem('nocobase.locale', 'en-US')",
  );
  const token = await api.post<{ token: string }>(
    'agents/runners/registrationTokens',
    { trust: 'team' },
  );
  const protocol = { [HEADERS.protocol]: String(PROTOCOL_VERSION) };
  const registration = await api.post<{ runnerKey: string }>(
    'agents/runners/register',
    {
      registrationToken: token.token,
      name: 'PM-303 diagnostics fixture',
      hostname: 'test-runtime',
      os: 'linux',
      arch: 'x64',
      version: '0.0.0',
      protocolVersion: PROTOCOL_VERSION,
      features: ['checkout', 'directories'],
      tools: [],
      slots: 1,
    },
    protocol,
  );
  const now = new Date().toISOString();
  await api.post(
    'agents/runners/workspaces',
    {
      workspaces: [],
      reportId: 'pm303-e2e',
      directories: [303, 304].map((key) => ({
        workDir: `/work/fixture/PM-${key}`,
        subjectKey: `PM-${key}`,
        lastUsedAt: now,
        unpushed: true,
        gitCheck: { reason: 'gitFailed', checkedAt: now },
        sizeMeasuredAt: now,
        ...(key === 303 ? { sizeBytes: 2 * 1024 ** 3 } : {}),
      })),
    },
    { ...protocol, [HEADERS.runnerKey]: registration.runnerKey },
  );
  await page.goto(url('/runtimes'));
  await page.getByText('PM-303 diagnostics fixture', { exact: true }).click();
  const sheet = page.getByTestId('runner-sheet');
  const measured = sheet.getByRole('button', {
    name: /PM-303 ·.*Git check failed/u,
  });
  await expect(measured).toBeVisible();
  await measured.scrollIntoViewIfNeeded();
  const output = process.env.NB_STUDIO_PM303_SCREENSHOT_DIR;
  if (output) {
    await mkdir(output, { recursive: true });
    await page.screenshot({
      path: path.join(output, 'pm303-git-failure-task-key.png'),
      fullPage: true,
    });
  }
  await measured.click();
  await expect(
    sheet.getByText('Disk usage: 2.00 GiB', { exact: true }),
  ).toBeVisible();
  await sheet
    .getByText('Disk usage: 2.00 GiB', { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(sheet.getByText(/^Disk usage measured at /u)).toBeVisible();
  if (output)
    await page.screenshot({
      path: path.join(output, 'pm303-measured-usage.png'),
      fullPage: true,
    });
  await sheet
    .getByRole('button', { name: /PM-304 ·.*Git check failed/u })
    .click();
  await expect(
    sheet.getByText('Disk usage: Unknown', { exact: true }),
  ).toBeVisible();
  await sheet
    .getByText('Disk usage: Unknown', { exact: true })
    .scrollIntoViewIfNeeded();
  if (output)
    await page.screenshot({
      path: path.join(output, 'pm303-unknown-usage.png'),
      fullPage: true,
    });
});

import type { Page } from '@playwright/test';

import type { KnowledgeSearchConfig } from '../shared/knowledge.ts';
import { expect, horizontalOverflow, open, test } from './support/fixtures.ts';

test.use({ user: 'admin' });

test.beforeEach(async ({ api }, info) => {
  const phone = info.title.includes('Chinese');
  await api.patch('users/me/preferences', {
    locale: phone ? 'zh-CN' : 'en-US',
    'theme.mode': phone ? 'dark' : 'light',
  });
});

test('read error and retry are usable in Chinese on a narrow dark screen', async ({
  page,
  context,
}, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await context.addInitScript(
    "localStorage.setItem('nocobase.locale', 'zh-CN'); localStorage.setItem('nocobase:main:theme:color-scheme', 'dark')",
  );
  const failure = await failReads(page);
  await open(page, '/config/knowledge-search');
  await expect(
    page.getByRole('heading', { name: '知识检索', exact: true }),
  ).toBeVisible();
  await expect.poll(failure.attempts).toBe(4);
  await expect(page.getByRole('alert')).toContainText('无法读取知识检索设置。');
  await expect(
    page.getByRole('button', { name: '重试', exact: true }),
  ).toBeVisible();
  expect(await horizontalOverflow(page)).toBe(0);
  await page.screenshot({
    path: info.outputPath('initial-read-error-zh-dark-phone.png'),
  });
});

async function failReads(page: Page) {
  let attempts = 0;
  let writes = 0;
  page.on('request', (request) => {
    if (
      new URL(request.url()).pathname === '/main/api/knowledgeSearch' &&
      request.method() !== 'GET'
    )
      writes++;
  });
  await page.route('**/main/api/knowledgeSearch', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    attempts++;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Injected read failure',
        },
      }),
    });
  });
  return {
    attempts: () => attempts,
    writes: () => writes,
    restore: () => page.unroute('**/main/api/knowledgeSearch'),
  };
}

test('initial read failure ends loading and retry restores real settings', async ({
  page,
  api,
}, info) => {
  await page
    .context()
    .addInitScript("localStorage.setItem('nocobase.locale', 'en-US')");
  const document = await api.get<{
    paths: Record<string, { get?: { operationId?: string } }>;
  }>('swagger');
  expect(
    Object.values(document.paths).some(
      (route) => route.get?.operationId === 'knowledgeSearchGetSettings',
    ),
  ).toBe(true);
  const before = await api.get<KnowledgeSearchConfig>('knowledgeSearch');
  const failure = await failReads(page);
  await open(page, '/config/knowledge-search');
  await expect(
    page.getByRole('heading', { name: 'Knowledge search', exact: true }),
  ).toBeVisible();
  await expect.poll(failure.attempts).toBe(4);
  console.log(
    JSON.stringify({
      scenario: 'initial read',
      failedReads: failure.attempts(),
      loading: await page.getByRole('status', { name: 'Loading…' }).count(),
      alerts: await page.getByRole('alert').count(),
    }),
  );
  await page.screenshot({ path: info.outputPath('after-retries-en.png') });
  await expect(page.getByRole('alert')).toContainText(
    'Could not load the knowledge search settings.',
  );
  await expect(page.getByRole('status', { name: 'Loading…' })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('initial-read-error-en.png') });
  await failure.restore();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('Search status', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(
    (await api.get<KnowledgeSearchConfig>('knowledgeSearch')).settings,
  ).toEqual(before.settings);
  expect(failure.writes()).toBe(0);
  await page.screenshot({ path: info.outputPath('recovered-en.png') });
  await info.attach('read-attempts', {
    body: JSON.stringify({
      failedReads: failure.attempts(),
      writes: failure.writes(),
    }),
    contentType: 'application/json',
  });
});

test('normal load and cached refresh failure preserve settings without writes', async ({
  page,
  api,
}, info) => {
  await page
    .context()
    .addInitScript("localStorage.setItem('nocobase.locale', 'en-US')");
  const before = await api.get<KnowledgeSearchConfig>('knowledgeSearch');
  await open(page, '/config/knowledge-search');
  await expect(page.getByText('Search status', { exact: true })).toBeVisible();
  const results = page.getByLabel('Results', { exact: true });
  await expect(results).toHaveValue(String(before.settings.recall.limit));
  const failure = await failReads(page);
  // A cached query refetches when its page remounts after becoming stale (10 s).
  await page.getByRole('link', { name: 'General', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'General', exact: true }),
  ).toBeVisible();
  await page.clock.install();
  await page.clock.fastForward(10_001);
  await page
    .getByRole('link', { name: 'Knowledge search', exact: true })
    .click();
  await page.clock.resume();
  await expect.poll(failure.attempts).toBe(4);
  await expect(page.getByRole('alert')).toContainText(
    'Could not load the knowledge search settings.',
  );
  await expect(results).toHaveValue(String(before.settings.recall.limit));
  await expect(page.getByText('Search status', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('refresh-error-en.png') });
  await failure.restore();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(
    (await api.get<KnowledgeSearchConfig>('knowledgeSearch')).settings,
  ).toEqual(before.settings);
  expect(failure.writes()).toBe(0);
});

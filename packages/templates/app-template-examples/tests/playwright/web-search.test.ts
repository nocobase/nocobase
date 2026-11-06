import enUS from '../../client/extensions/nocobase-agent-chat/locales/en-US.js';
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

const appUrl = process.env.APP_URL;
const fixtureUrl = process.env.WEBSEARCH_FIXTURE_URL;
test.skip(
  !appUrl ||
    !fixtureUrl ||
    !process.env.E2E_USERNAME ||
    !process.env.E2E_PASSWORD,
  'Run the isolated web-search-browser-server fixture with APP_URL, WEBSEARCH_FIXTURE_URL and synthetic E2E credentials.',
);
test.use({
  locale: 'en-US',
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 375, height: 812 },
]) {
  const model = viewport.width === 375 ? 'future-openai-chat-model' : 'gpt-5.4';
  test(`native web search survives history, configuration changes and Stop (${viewport.width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    if (!appUrl || !fixtureUrl)
      throw new Error('Expected isolated application and model transport');
    const app = appUrl.replace(/\/$/u, '');
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const headers = { origin: new URL(app).origin };
    let serviceName: string | undefined;
    const stats = async () =>
      z
        .object({ main: z.number(), search: z.number(), closed: z.number() })
        .parse(await (await page.request.get(fixtureUrl + '/stats')).json());
    const mode = async (value: 'success' | 'partial' | 'hang') =>
      expect(
        (
          await page.request.post(fixtureUrl + '/mode', {
            data: { mode: value },
          })
        ).status(),
      ).toBe(204);
    const shot = async (name: string) => {
      if (!process.env.E2E_SCREENSHOT_DIR) return;
      await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(
          process.env.E2E_SCREENSHOT_DIR,
          `web-search-${viewport.width}-${name}.png`,
        ),
        fullPage: true,
      });
    };
    try {
      await mode('success');
      await page.goto(app + '/login');
      await page
        .getByLabel('Username or email')
        .fill(process.env.E2E_USERNAME ?? '');
      await page
        .getByLabel('Password', { exact: true })
        .fill(process.env.E2E_PASSWORD ?? '');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL((url) => !url.pathname.endsWith('/login'));
      const service = await page.request.post(app + '/api/agents/services', {
        headers,
        data: {
          title: 'Offline browser search',
          provider: 'openai',
          apiKey: 'synthetic-web-search-only',
          models: [{ value: model, kind: 'chat' }],
        },
      });
      expect(service.status()).toBe(201);
      serviceName = z
        .object({ data: z.object({ name: z.string() }) })
        .parse(await service.json()).data.name;
      await page.reload();
      await page.getByTestId('chat-header-button').click();
      const panel = page.getByTestId('chat-panel');
      const toggle = panel.getByTestId('chat-web-search-toggle');
      await expect(toggle).toBeDisabled();
      await panel
        .getByRole('button', { name: 'Default model', exact: true })
        .click();
      await page
        .locator(
          `[role="menuitem"][data-model-service="${serviceName}"][data-model="${model}"]`,
        )
        .click();
      await expect(toggle).toBeEnabled();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await panel.locator('textarea').fill('First turn without search.');
      const created = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/agents/conversations'),
      );
      await panel.getByTestId('chat-send').click();
      const id = z
        .object({ data: z.object({ id: z.string() }) })
        .parse(await (await created).json()).data.id;
      expect((await created).request().postDataJSON()).toMatchObject({
        selectedModel: { modelService: serviceName, model },
        config: { webSearch: false },
      });
      const endpoint = app + '/api/agents/conversations/' + id;
      const detail = async () =>
        z
          .object({
            data: z.object({
              execution: z.object({ status: z.string() }).nullish(),
            }),
          })
          .parse(await (await page.request.get(endpoint)).json()).data;
      await expect
        .poll(async () => (await detail()).execution?.status)
        .toBe('idle');
      expect((await stats()).search).toBe(0);
      const configChange = page.waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          response.url().endsWith('/' + id + '/config'),
      );
      await toggle.click();
      expect((await configChange).status()).toBe(200);
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await panel
        .locator('textarea')
        .fill('Now search for public documentation.');
      await panel.getByTestId('chat-send').click();
      const card = panel.getByTestId('chat-web-search');
      await expect(card).toHaveCount(1);
      await expect(card).toHaveAttribute('aria-busy', 'false');
      await expect(card.getByRole('link')).toHaveCount(2);
      await expect
        .poll(async () => (await detail()).execution?.status)
        .toBe('idle');
      expect((await stats()).search).toBe(2);
      await expect(card.getByRole('link')).toHaveCount(2);
      await expect(card.locator('script')).toHaveCount(0);
      await expect(card).toContainText(
        '<script>This is text, not executable HTML.</script>',
      );
      await expect
        .poll(() =>
          page.evaluate(
            'document.documentElement.scrollWidth <= window.innerWidth',
          ),
        )
        .toBe(true);
      await shot('completed');
      await page.goto(app + '/?chat=' + encodeURIComponent(id));
      await expect(card).toHaveCount(1);
      await expect(card).toHaveAttribute('aria-busy', 'false');
      expect((await stats()).search).toBe(2);
      await shot('history');
      await mode('partial');
      await panel
        .locator('textarea')
        .fill('Search with one unavailable result.');
      await panel.getByTestId('chat-send').click();
      await expect(card).toHaveCount(2);
      await expect(card.last()).toContainText(enUS.chat.webSearch.unavailable);
      await expect
        .poll(async () => (await detail()).execution?.status)
        .toBe('idle');
      expect((await stats()).search).toBe(2);
      await shot('partial');
      await mode('hang');
      await panel.locator('textarea').fill('Search until I press Stop.');
      await panel.getByTestId('chat-send').click();
      await expect.poll(async () => (await stats()).search).toBe(2);
      await expect(toggle).toBeDisabled();
      await expect(card.last()).toHaveAttribute('aria-busy', 'true');
      await panel.getByTestId('chat-stop').click();
      await expect
        .poll(async () => (await detail()).execution?.status)
        .toBe('idle');
      await expect.poll(async () => (await stats()).closed).toBe(2);
      await expect(card.last()).toHaveAttribute('aria-busy', 'false');
      await expect(toggle).toBeEnabled();
      await shot('stopped');
      await page.goto(app + '/?chat=' + encodeURIComponent(id));
      await expect(card).toHaveCount(3);
      await expect(
        panel.locator('[aria-busy="true"][data-testid="chat-web-search"]'),
      ).toHaveCount(0);
      expect((await stats()).search).toBe(2);
      expect(errors).toEqual([]);
    } finally {
      if (serviceName)
        await page.request.delete(app + '/api/agents/services/' + serviceName, {
          headers,
        });
    }
  });
}

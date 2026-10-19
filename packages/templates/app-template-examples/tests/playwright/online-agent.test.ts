import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createOnlineAgentModelFixture } from '../fixtures/online-agent-model.js';

const applicationUrl = process.env.APP_URL;
test.skip(
  !applicationUrl || !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
  'Set APP_URL to an isolated application entry and E2E_USERNAME/E2E_PASSWORD to its administrator.',
);
test.use({
  viewport: { width: 1440, height: 1000 },
  locale: 'en-US',
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

test('streams through the installed chat, persists across reload and stops independently', async ({
  page,
}) => {
  const app = applicationUrl!.replace(/\/$/, '');
  const fixture = await createOnlineAgentModelFixture();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let serviceName: string | undefined;
  const headers = { origin: new URL(app).origin };
  const screenshot = async (name: string) => {
    if (!process.env.E2E_SCREENSHOT_DIR) return;
    await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(process.env.E2E_SCREENSHOT_DIR, name),
      fullPage: true,
    });
  };
  try {
    await page.goto(app + '/login');
    await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
    await page
      .getByLabel('Password', { exact: true })
      .fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));
    const service = await page.request.post(app + '/api/agents/services', {
      headers,
      data: {
        title: 'Browser smoke local model',
        provider: 'openai-compatible',
        baseUrl: fixture.url,
        apiKey: 'isolated-local-fixture-only',
        enabled: true,
        models: [{ value: 'fixture-chat', kind: 'chat' }],
      },
    });
    expect(service.status()).toBe(201);
    serviceName = (await service.json()).data.name;
    await page.reload();
    await page.getByTestId('chat-header-button').click();
    const panel = page.getByTestId('chat-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId('chat-send')).toBeDisabled();
    await panel
      .locator('textarea')
      .fill('Verify the generated application chat.');
    await expect(panel.getByTestId('chat-send')).toBeEnabled();
    const created = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/api/agents/conversations'),
    );
    const sent = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/messages'),
    );
    await panel.getByTestId('chat-send').click();
    const conversationId: string = (await (await created).json()).data.id;
    expect((await sent).headers()['x-vercel-ai-ui-message-stream']).toBe('v1');
    const endpoint = app + '/api/agents/conversations/' + conversationId;
    const detail = async () =>
      (await (await page.request.get(endpoint)).json()).data;
    const history = async () =>
      (await (await page.request.get(endpoint + '/messages?after=0')).json())
        .data as { id: string; role: string; parts: unknown[] }[];
    await expect.poll(() => fixture.streams.length).toBe(1);
    await expect(
      panel.getByText('Hello from the local model fixture.', { exact: true }),
    ).toBeVisible();
    await expect(panel.getByTestId('chat-stop')).toBeEnabled();
    await expect(panel.locator('[data-streaming]')).toHaveCount(1);
    await screenshot('phase-e-generated-examples-stream.png');
    fixture.append(0, ' Saved without a workspace link.');
    fixture.complete(0);
    await expect
      .poll(async () => (await detail()).execution?.status)
      .toBe('idle');
    const saved = await history();
    expect(saved.map((message) => message.role)).toEqual(['user', 'assistant']);
    const assistant = saved[1]!;
    expect(assistant.parts).toContainEqual({
      type: 'text',
      text: 'Hello from the local model fixture. Saved without a workspace link.',
      state: 'done',
    });
    await page.goto(app + '/?chat=' + encodeURIComponent(conversationId));
    await expect(panel).toBeVisible();
    await expect(
      panel.getByText(
        'Hello from the local model fixture. Saved without a workspace link.',
        { exact: true },
      ),
    ).toHaveCount(1);
    expect(fixture.streams).toHaveLength(1);
    expect((await history()).map((message) => message.id)).toEqual(
      saved.map((message) => message.id),
    );
    await screenshot('phase-e-generated-examples-history.png');
    await panel.locator('textarea').fill('Continue until I press Stop.');
    await panel.getByTestId('chat-send').click();
    await expect.poll(() => fixture.streams.length).toBe(2);
    await expect(panel.getByTestId('chat-stop')).toBeEnabled();
    await expect(
      panel.getByText('Hello from the local model fixture.', { exact: true }),
    ).toBeVisible();
    expect(JSON.stringify(fixture.requests.at(-1)!.messages)).toContain(
      'Saved without a workspace link.',
    );
    const stopped = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/' + conversationId + '/stop'),
    );
    await panel.getByTestId('chat-stop').click();
    expect((await stopped).status()).toBe(200);
    await expect
      .poll(async () => (await detail()).execution?.status)
      .toBe('idle');
    expect((await detail()).execution?.outcome).toBe('cancelled');
    expect((await history()).map((message) => message.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ]);
    expect(fixture.streams).toHaveLength(2);
    await expect(panel.locator('[data-streaming]')).toHaveCount(0);
    await expect(panel.getByTestId('chat-stop')).toHaveCount(0);
    await screenshot('phase-e-generated-examples-stopped.png');
    await page.goto(app + '/?chat=' + encodeURIComponent(conversationId));
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-streaming]')).toHaveCount(0);
    expect(fixture.streams).toHaveLength(2);
    await panel
      .locator('textarea')
      .fill('Continue after the saved partial reply.');
    await panel.getByTestId('chat-send').click();
    await expect.poll(() => fixture.streams.length).toBe(3);
    await expect(panel.locator('[data-streaming]')).toHaveCount(1);
    fixture.complete(2);
    await expect
      .poll(async () => (await detail()).execution?.status)
      .toBe('idle');
    await expect(panel.locator('[data-streaming]')).toHaveCount(0);
    expect(fixture.streams).toHaveLength(3);
    expect(errors).toEqual([]);
  } finally {
    if (serviceName)
      await page.request.delete(app + '/api/agents/services/' + serviceName, {
        headers,
      });
    await fixture.close();
  }
});

for (const viewport of [
  { name: 'desktop docked', width: 1440, height: 1000, mode: 'docked' },
  { name: 'mobile', width: 375, height: 812, mode: 'mobile' },
]) {
  test(`keeps empty thinking and completed markdown contained in the shared chat (${viewport.name})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const app = applicationUrl!.replace(/\/$/, '');
    const fixture = await createOnlineAgentModelFixture({ initialText: '' });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const headers = { origin: new URL(app).origin };
    let serviceName: string | undefined;
    const screenshot = async (phase: string) => {
      if (!process.env.E2E_SCREENSHOT_DIR) return;
      await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(
          process.env.E2E_SCREENSHOT_DIR,
          `shared-chat-${viewport.width}-${phase}.png`,
        ),
        fullPage: true,
      });
    };
    try {
      await page.goto(app + '/login');
      await page
        .getByLabel('Username or email')
        .fill(process.env.E2E_USERNAME!);
      await page
        .getByLabel('Password', { exact: true })
        .fill(process.env.E2E_PASSWORD!);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL((url) => !url.pathname.endsWith('/login'));
      const service = await page.request.post(app + '/api/agents/services', {
        headers,
        data: {
          title: `Shared chat containment ${viewport.width}`,
          provider: 'openai-compatible',
          baseUrl: fixture.url,
          apiKey: 'isolated-local-fixture-only',
          enabled: true,
          models: [{ value: 'fixture-chat', kind: 'chat' }],
        },
      });
      expect(service.status()).toBe(201);
      serviceName = (await service.json()).data.name;
      await page.reload();
      await page.getByTestId('chat-header-button').click();
      const panel = page.getByTestId('chat-panel');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-mode', viewport.mode);
      await panel.locator('textarea').fill('Show a readable markdown reply.');
      const created = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/agents/conversations'),
      );
      await panel.getByTestId('chat-send').click();
      const conversationId: string = (await (await created).json()).data.id;
      const endpoint =
        app + '/api/agents/conversations/' + encodeURIComponent(conversationId);
      const detail = async () => {
        const response = await page.request.get(endpoint);
        expect(response.status()).toBe(200);
        return (await response.json()).data;
      };
      const history = async () => {
        const response = await page.request.get(endpoint + '/messages?after=0');
        expect(response.status()).toBe(200);
        return (await response.json()).data as {
          id: string;
          role: string;
          parts: unknown[];
        }[];
      };
      const assistant = panel.locator('[data-chat-message=assistant]');
      await expect.poll(() => fixture.streams.length).toBe(1);
      await expect(
        panel.locator('[data-chat-feedback=thinking]'),
      ).toBeVisible();
      await expect(assistant).toHaveCount(0);
      await screenshot('thinking');

      const inlineId = 'inline_' + '0123456789abcdef'.repeat(30);
      const codeLine = `const identifier = "${'unbroken_'.repeat(100)}";`;
      const columns = Array.from(
        { length: 8 },
        (_, index) => `Column ${index}`,
      );
      const markdown = [
        'Completed is application text',
        '',
        `Plain identifier: ${inlineId}`,
        '',
        `Inline identifier: \`${inlineId}\``,
        '',
        `| ${columns.join(' | ')} |`,
        `| ${columns.map(() => '---').join(' | ')} |`,
        `| ${columns.map((_, index) => `${index}_${inlineId}`).join(' | ')} |`,
        '',
        '```javascript',
        codeLine,
        '```',
        '',
        'End of the readable reply.',
      ].join('\n');
      fixture.append(0, markdown);
      await expect(
        assistant.getByText('End of the readable reply.', { exact: true }),
      ).toBeVisible();
      fixture.complete(0);
      await expect
        .poll(async () => (await detail()).execution?.status)
        .toBe('idle');
      await expect(panel.locator('[data-streaming]')).toHaveCount(0);

      const assertCompletedReply = async () => {
        await expect(assistant).toHaveCount(1);
        await expect(
          assistant.getByText('Completed is application text', { exact: true }),
        ).toBeVisible();
        await expect(assistant.locator('p code')).toHaveText(inlineId);
        await expect(assistant.locator('pre code')).toHaveText(codeLine);
        await expect(assistant.locator('tbody td')).toHaveCount(columns.length);
        await expect(assistant.locator('tbody td').last()).toHaveText(
          `7_${inlineId}`,
        );
        // Semantic selectors also cover translated feedback without relying on its copy.
        await expect(
          panel.locator('[data-chat-feedback=completed]'),
        ).toHaveCount(0);
        await expect(panel.getByText('Completed', { exact: true })).toHaveCount(
          0,
        );
        const saved = await history();
        const reply = saved.find((message) => message.role === 'assistant');
        expect(reply?.parts).toContainEqual({
          type: 'text',
          text: markdown,
          state: 'done',
        });
        // Success remains in the durable protocol; only its presentation is suppressed.
        expect(reply?.parts).toContainEqual({
          type: 'data-notice',
          id: 'execution-status',
          data: { type: 'completed', title: 'Completed' },
        });
        const transcript = panel.getByTestId('chat-message-scroll');
        const dimensions = await transcript.evaluate((element) => ({
          scroll: 'scrollWidth' in element ? Number(element.scrollWidth) : 0,
          client: 'clientWidth' in element ? Number(element.clientWidth) : 0,
        }));
        expect(dimensions.client).toBeGreaterThan(0);
        expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
        const bounds = await transcript.boundingBox();
        expect(bounds).not.toBeNull();
        // Check the bubble and nested scroll containers, not only a clipped transcript.
        const bubble = assistant.locator(':scope > div > div').first();
        for (const content of [
          assistant,
          bubble,
          assistant.locator('pre'),
          assistant.locator('table').locator('..'),
        ]) {
          const box = await content.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThan(0);
          expect(box!.x).toBeGreaterThanOrEqual(bounds!.x - 1);
          expect(box!.x + box!.width).toBeLessThanOrEqual(
            bounds!.x + bounds!.width + 1,
          );
        }
        const codeDimensions = await assistant
          .locator('pre')
          .evaluate((element) => ({
            scroll: 'scrollWidth' in element ? Number(element.scrollWidth) : 0,
            client: 'clientWidth' in element ? Number(element.clientWidth) : 0,
          }));
        expect(codeDimensions.scroll).toBeGreaterThan(codeDimensions.client);
        const codeScrollLeft = await assistant
          .locator('pre')
          .evaluate((element) => {
            if ('scrollLeft' in element && 'scrollWidth' in element) {
              element.scrollLeft = Number(element.scrollWidth);
              return Number(element.scrollLeft);
            }
            return 0;
          });
        expect(codeScrollLeft).toBeGreaterThan(0);
        await assistant.locator('pre').evaluate((element) => {
          if ('scrollLeft' in element) element.scrollLeft = 0;
        });
        const tableScrollLeft = await assistant
          .locator('table')
          .locator('..')
          .evaluate((element) => {
            if ('scrollLeft' in element && 'scrollWidth' in element) {
              element.scrollLeft = Number(element.scrollWidth);
              const left = Number(element.scrollLeft);
              element.scrollLeft = 0;
              return left;
            }
            return 0;
          });
        expect(tableScrollLeft).toBeGreaterThan(0);
        return saved.map((message) => message.id);
      };
      const savedIds = await assertCompletedReply();
      await screenshot('completed');
      // Examples resets the panel on reload; its public link restores saved history.
      await page.goto(app + '/?chat=' + encodeURIComponent(conversationId));
      await expect(panel).toBeVisible();
      expect(await assertCompletedReply()).toEqual(savedIds);
      await screenshot('history');
      expect(fixture.streams).toHaveLength(1);
      expect(errors).toEqual([]);
    } finally {
      try {
        if (serviceName)
          await page.request.delete(
            app + '/api/agents/services/' + encodeURIComponent(serviceName),
            { headers },
          );
      } finally {
        await fixture.close();
      }
    }
  });
}

test('keeps partial approvals pending and renders advisory uncertainty', async ({
  page,
}) => {
  test.skip(
    !process.env.PM481_BROWSER_FIXTURE,
    'Use the isolated online-agent-browser-server fixture.',
  );
  const app = applicationUrl!.replace(/\/$/, '');
  const fixture = await createOnlineAgentModelFixture({ initialText: '' });
  const headers = { origin: new URL(app).origin };
  let serviceName: string | undefined;
  try {
    await page.goto(app + '/login');
    await page.getByLabel('Username or email').fill(process.env.E2E_USERNAME!);
    await page
      .getByLabel('Password', { exact: true })
      .fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));
    const configured = await page.request.post(app + '/api/agents/services', {
      headers,
      data: {
        title: 'Installed approval fixture',
        provider: 'openai-compatible',
        baseUrl: fixture.url,
        apiKey: 'isolated-local-fixture-only',
        enabled: true,
        models: [{ value: 'fixture-chat', kind: 'chat' }],
      },
    });
    expect(configured.status()).toBe(201);
    serviceName = (await configured.json()).data.name;
    const created = await page.request.post(app + '/api/agents/conversations', {
      headers,
      data: {
        agentId: 'online',
        config: { scope: ['fixture-approval'] },
        selectedModel: { modelService: serviceName, model: 'fixture-chat' },
      },
    });
    expect(created.status()).toBe(201);
    const id = (await created.json()).data.id;
    const endpoint = app + '/api/agents/conversations/' + id;
    const detail = async () =>
      (await (await page.request.get(endpoint)).json()).data;
    await page.goto(app + '/?chat=' + encodeURIComponent(id));
    const panel = page.getByTestId('chat-panel');
    await expect(panel).toBeVisible();
    await panel
      .locator('textarea')
      .fill('Request two separately approved actions.');
    await panel.getByTestId('chat-send').click();
    await expect.poll(() => fixture.streams.length).toBe(1);
    fixture.tools(0, [
      { id: 'first', value: 'normal' },
      { id: 'second', value: 'uncertain' },
    ]);
    await expect(
      panel.getByRole('button', { name: 'Approve', exact: true }),
    ).toHaveCount(2);
    await panel
      .getByRole('button', { name: 'Approve', exact: true })
      .first()
      .click();
    await expect(
      panel.getByRole('button', { name: 'Approve', exact: true }),
    ).toHaveCount(1);
    expect(fixture.streams).toHaveLength(1);
    expect((await detail()).execution.waitingApproval).toBe(true);
    // Examples resets the panel on reload; restore it through the public conversation link.
    await page.goto(app + '/?chat=' + encodeURIComponent(id));
    await expect(
      panel.getByRole('button', { name: 'Approve', exact: true }),
    ).toHaveCount(1);
    expect(fixture.streams).toHaveLength(1);
    if (process.env.E2E_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(
          process.env.E2E_SCREENSHOT_DIR,
          'integration-approval.png',
        ),
        fullPage: true,
      });
    await panel.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect.poll(() => fixture.streams.length).toBe(2);
    // SDK continuation sees the actual exception; the next saved turn uses the canonical unknown fact below.
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      'Fixture outcome unknown',
    );
    fixture.append(1, 'The approved actions have been reconciled.');
    fixture.complete(1);
    await expect
      .poll(async () => (await detail()).execution.status)
      .toBe('idle');
    await panel.locator('textarea').fill('Continue after the advisory.');
    await expect(panel.getByTestId('chat-send')).toBeEnabled();
    await expect(panel.locator('[data-streaming]')).toHaveCount(0);
    if (process.env.E2E_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(
          process.env.E2E_SCREENSHOT_DIR,
          'integration-advisory.png',
        ),
        fullPage: true,
      });
    await panel.getByTestId('chat-send').click();
    await expect.poll(() => fixture.streams.length).toBe(3);
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      'Tool result unknown',
    );
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      'Action completed',
    );
    fixture.append(2, 'Continued without repeating completed actions.');
    fixture.complete(2);
    await expect
      .poll(async () => (await detail()).execution.status)
      .toBe('idle');
  } finally {
    if (serviceName)
      await page.request.delete(
        app + '/api/agents/services/' + encodeURIComponent(serviceName),
        { headers },
      );
    await fixture.close();
  }
});

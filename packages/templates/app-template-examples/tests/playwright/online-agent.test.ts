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

test('keeps partial approvals pending and renders advisory uncertainty and installed consultation cards', async ({
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
    await page.reload();
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
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      'Tool result unknown',
    );
    fixture.append(1, 'The approved actions have been reconciled.');
    fixture.complete(1);
    await expect
      .poll(async () => (await detail()).execution.status)
      .toBe('idle');
    await expect(panel.getByTestId('chat-consultation')).toBeVisible();
    await panel
      .getByTestId('chat-consultation')
      .locator('button')
      .first()
      .click();
    await expect(
      panel.getByText('The installed extension is ready.', { exact: true }),
    ).toBeVisible();
    await expect(panel.getByText(/1,840/)).toBeVisible();
    await expect(panel.getByText(/Proposed .*plans/)).toHaveCount(0);
    await panel.locator('textarea').fill('Continue after the advisory.');
    await expect(panel.getByTestId('chat-send')).toBeEnabled();
    await expect(panel.locator('[data-streaming]')).toHaveCount(0);
    if (process.env.E2E_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(
          process.env.E2E_SCREENSHOT_DIR,
          'integration-advisory-and-card.png',
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

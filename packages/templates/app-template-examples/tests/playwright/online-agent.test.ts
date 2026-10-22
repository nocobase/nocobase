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
        // Read layout and scrolling in one DOM task while restored messages may still be replaced.
        const readGeometry = () =>
          transcript.evaluate((element) => {
            // This test also typechecks in the Node-only project.
            type LayoutElement = {
              querySelector(selector: string): LayoutElement | null;
              getClientRects(): ArrayLike<unknown>;
              getBoundingClientRect(): { x: number; width: number };
              readonly parentElement: LayoutElement | null;
              readonly isConnected: boolean;
              readonly scrollWidth: number;
              readonly clientWidth: number;
              scrollLeft: number;
            };
            const root = element as unknown as LayoutElement;
            const reply = root.querySelector('[data-chat-message=assistant]');
            const code = reply?.querySelector('pre') ?? null;
            const table = reply?.querySelector('table')?.parentElement ?? null;
            const boundsOf = (node: LayoutElement | null) => {
              if (!node || node.getClientRects().length === 0) return null;
              const { x, width } = node.getBoundingClientRect();
              return { x, width };
            };
            const scrollOf = (node: LayoutElement | null) => {
              if (!node) return 0;
              node.scrollLeft = node.scrollWidth;
              const left = node.scrollLeft;
              node.scrollLeft = 0;
              return left;
            };
            const contents = [
              reply,
              reply?.querySelector(':scope > div > div') ?? null,
              code,
              table,
            ].map(boundsOf);
            return {
              ready:
                root.isConnected &&
                root.clientWidth > 0 &&
                (code?.clientWidth ?? 0) > 0 &&
                contents.every((box) => box !== null),
              dimensions: {
                scroll: root.scrollWidth,
                client: root.clientWidth,
              },
              bounds: boundsOf(root),
              contents,
              codeDimensions: {
                scroll: code?.scrollWidth ?? 0,
                client: code?.clientWidth ?? 0,
              },
              codeScrollLeft: scrollOf(code),
              tableScrollLeft: scrollOf(table),
            };
          });
        let geometry: Awaited<ReturnType<typeof readGeometry>> | undefined;
        await expect
          .poll(async () => {
            geometry = await readGeometry();
            return geometry.ready;
          })
          .toBe(true);
        const snapshot = geometry!;
        expect(snapshot.dimensions.client).toBeGreaterThan(0);
        expect(snapshot.dimensions.scroll).toBeLessThanOrEqual(
          snapshot.dimensions.client + 1,
        );
        const bounds = snapshot.bounds;
        expect(bounds).not.toBeNull();
        // Check the bubble and nested scroll containers, not only a clipped transcript.
        for (const box of snapshot.contents) {
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThan(0);
          expect(box!.x).toBeGreaterThanOrEqual(bounds!.x - 1);
          expect(box!.x + box!.width).toBeLessThanOrEqual(
            bounds!.x + bounds!.width + 1,
          );
        }
        expect(snapshot.codeDimensions.scroll).toBeGreaterThan(
          snapshot.codeDimensions.client,
        );
        expect(snapshot.codeScrollLeft).toBeGreaterThan(0);
        expect(snapshot.tableScrollLeft).toBeGreaterThan(0);
        return saved.map((message) => message.id);
      };
      const savedIds = await assertCompletedReply();
      await screenshot('completed');
      // Examples resets the panel on reload; its public link restores saved history.
      await page.goto(app + '/?chat=' + encodeURIComponent(conversationId));
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-mode', viewport.mode);
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

for (const width of [1440, 375]) {
  test(`displays reasoning with stable manual choice, history and Stop at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const app = applicationUrl!.replace(/\/$/, '');
    const fixture = await createOnlineAgentModelFixture({ scene: 'reasoning' });
    const headers = { origin: new URL(app).origin };
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let serviceName: string | undefined;
    const shot = async (phase: string) => {
      if (!process.env.E2E_SCREENSHOT_DIR) return;
      await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(
          process.env.E2E_SCREENSHOT_DIR,
          `reasoning-${width}-${phase}.png`,
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
          title: `Reasoning fixture ${width}`,
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
      await panel.locator('textarea').fill('Reason, then answer.');
      const created = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith('/api/agents/conversations'),
      );
      await panel.getByTestId('chat-send').click();
      const conversationId: string = (await (await created).json()).data.id;
      const endpoint = app + '/api/agents/conversations/' + conversationId;
      const detail = async () =>
        (await (await page.request.get(endpoint)).json()).data;
      const history = async () =>
        (await (await page.request.get(endpoint + '/messages?after=0')).json())
          .data as { id: string; role: string; parts: unknown[] }[];
      await expect.poll(() => fixture.streams.length).toBe(1);
      await expect(panel.locator('[data-chat-part=reasoning]')).toHaveCount(0);
      fixture.reasoning(0, 'Model reasoning begins.');
      const reasoning = panel.locator('[data-chat-part=reasoning]');
      const toggle = reasoning.getByRole('button');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(reasoning).toHaveAttribute(
        'data-reasoning-streaming',
        'true',
      );
      await expect(panel.locator('[data-chat-feedback=thinking]')).toHaveCount(
        0,
      );
      await expect(panel.locator('[data-streaming]')).toHaveCount(0);
      const longLine = 'reasoning_code_'.repeat(100);
      fixture.reasoning(0, '\n\n```text\n' + longLine + '\n```');
      await expect(reasoning.locator('pre code')).toHaveText(longLine);
      const transcript = panel.getByTestId('chat-message-scroll');
      const geometry = await transcript.evaluate((node) => {
        // The Node test config deliberately has no DOM library; describe only the sampled browser properties.
        const element = node as unknown as {
          scrollWidth: number;
          clientWidth: number;
          querySelector(selector: string): {
            scrollWidth: number;
            clientWidth: number;
            scrollLeft: number;
          } | null;
        };
        const code = element.querySelector('[data-chat-part=reasoning] pre');
        if (!code) throw new Error('Missing reasoning code block.');
        code.scrollLeft = code.scrollWidth;
        return {
          width: element.clientWidth,
          scroll: element.scrollWidth,
          codeScroll: code.scrollLeft,
        };
      });
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
      expect(geometry.codeScroll).toBeGreaterThan(0);
      await shot('streaming-light');
      fixture.append(0, 'Final answer.');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(panel.getByTestId('chat-stop')).toBeEnabled();
      fixture.complete(0);
      await expect
        .poll(async () => (await detail()).execution?.status)
        .toBe('idle');
      const saved = await history();
      expect(JSON.stringify(saved)).toContain('Model reasoning begins.');
      expect(JSON.stringify(saved)).not.toContain('providerMetadata');
      await page.goto(app + '/?chat=' + conversationId);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(reasoning).not.toHaveAttribute(
        'data-reasoning-streaming',
        'true',
      );
      expect((await history()).map((message) => message.id)).toEqual(
        saved.map((message) => message.id),
      );
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Space');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await panel.locator('textarea').fill('Keep my manual choice.');
      await panel.getByTestId('chat-send').click();
      await expect.poll(() => fixture.streams.length).toBe(2);
      fixture.reasoning(1, 'Second reasoning');
      const second = panel.locator('[data-chat-part=reasoning]').nth(1);
      const secondToggle = second.getByRole('button');
      await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');
      await secondToggle.click();
      fixture.reasoning(1, ' delta');
      await expect(secondToggle).toHaveAttribute('aria-expanded', 'false');
      await secondToggle.click();
      fixture.append(1, 'Second answer');
      await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');
      fixture.complete(1);
      await expect
        .poll(async () => (await detail()).execution?.status)
        .toBe('idle');
      await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');
      await panel.locator('textarea').fill('Stop during reasoning.');
      await panel.getByTestId('chat-send').click();
      await expect.poll(() => fixture.streams.length).toBe(3);
      fixture.reasoning(2, 'Partial reasoning saved on Stop');
      await expect(
        panel.getByText('Partial reasoning saved on Stop'),
      ).toBeVisible();
      await panel.getByTestId('chat-stop').click();
      await expect
        .poll(async () => (await detail()).execution?.outcome)
        .toBe('cancelled');
      await expect(
        panel.locator('[data-reasoning-streaming=true]'),
      ).toHaveCount(0);
      await page.goto(app + '/?chat=' + conversationId);
      const partial = panel.locator('[data-chat-part=reasoning]').nth(2);
      await expect(partial.getByRole('button')).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await partial.getByRole('button').click();
      await expect(
        partial.getByText('Partial reasoning saved on Stop'),
      ).toBeVisible();
      expect(fixture.streams).toHaveLength(3);
      // Exercise the real application language control, not a mocked translation provider.
      await panel.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('button', { name: 'Open account menu' }).click();
      await page.getByRole('menuitem', { name: /Language/ }).hover();
      await page
        .getByRole('menuitemradio', { name: '中文', exact: true })
        .click();
      await page.getByTestId('chat-header-button').click();
      await expect(panel.getByRole('button', { name: '推理过程' })).toHaveCount(
        3,
      );
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await expect(page.locator('html')).toHaveClass(/dark/);
      await shot('history-dark-zh');
      expect(errors).toEqual([]);
    } finally {
      if (serviceName)
        await page.request.delete(app + '/api/agents/services/' + serviceName, {
          headers,
        });
      await fixture.close();
    }
  });
}

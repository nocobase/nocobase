import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createOnlineAgentModelFixture } from '../fixtures/online-agent-model.js';

const applicationUrl = process.env.APP_URL;
test.skip(
  !applicationUrl || !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
  'Run against an isolated application with the browser acceptance fixture.',
);
test.use({
  locale: 'en-US',
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

for (const width of [1440, 375, 412]) {
  test.describe(`${width}px`, () => {
    test.use({ isMobile: width < 768, hasTouch: width < 768 });
    test(`thinking picker keeps its settings inline and persists choices at ${width}px`, async ({
      page,
    }) => {
      page.setDefaultTimeout(15_000);
      await page.setViewportSize({ width, height: width === 375 ? 667 : 1000 });
      const app = applicationUrl!.replace(/\/$/, '');
      const fixture = await createOnlineAgentModelFixture();
      const headers = { origin: new URL(app).origin };
      const errors: string[] = [];
      const screenshot = async (
        options: Parameters<typeof page.screenshot>[0],
      ) => {
        // Inspect settled theme/overlay states without disabling their real transitions.
        await page.evaluate(async () => {
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          await Promise.all(
            document
              .getAnimations()
              .filter(
                (animation) =>
                  animation.effect?.getComputedTiming().iterations !== Infinity,
              )
              .map((animation) => animation.finished.catch(() => {})),
          );
        });
        await page.screenshot(options);
      };
      page.on('pageerror', (error) => errors.push(error.message));
      let serviceName: string | undefined;
      try {
        await page.goto(app + '/login');
        await page
          .getByLabel('Username or email')
          .fill(process.env.E2E_USERNAME!);
        await page
          .getByLabel('Password', { exact: true })
          .fill(process.env.E2E_PASSWORD!);
        await page
          .getByRole('button', { name: 'Sign in', exact: true })
          .click();
        await page.waitForURL((url) => !url.pathname.endsWith('/login'));
        const service = await page.request.post(app + '/api/agents/services', {
          headers,
          data: {
            title: `Thinking fixture ${width}`,
            provider: 'openai-compatible',
            baseUrl: fixture.url,
            apiKey: 'isolated-local-fixture-only',
            enabled: true,
            // No model declares thinking levels: every Online chat model offers all of them.
            models: [
              {
                value: 'levels',
                label: 'Atlas Pro Extended Reasoning',
                kind: 'chat',
              },
              { value: 'many', label: 'Orbit Max', kind: 'chat' },
              { value: 'basic', label: 'Text Basic', kind: 'chat' },
            ],
          },
        });
        expect(service.status()).toBe(201);
        serviceName = (await service.json()).data.name;
        const modelRow = (model: string) =>
          page.locator(
            `[data-model-service="${serviceName}"][data-model="${model}"]`,
          );
        // The service API and the Model services page carry no thinking setting.
        const refused = await page.request.patch(
          app + '/api/agents/services/' + serviceName,
          {
            headers,
            data: {
              models: [{ value: 'levels', reasoning: { levels: ['high'] } }],
            },
          },
        );
        expect(refused.status()).toBe(400);
        if (width === 1440) {
          await page.goto(app + '/settings/models');
          await page
            .getByRole('button', {
              name: `Edit Thinking fixture ${width}`,
              exact: true,
            })
            .click();
          const editor = page.getByRole('dialog');
          await expect(
            editor.getByRole('listitem', { name: 'many' }),
          ).toBeVisible();
          // Each chat model row offers only what it is for; no thinking setting.
          await expect(
            editor.getByRole('list', { name: 'Models' }).getByText(/thinking/i),
          ).toHaveCount(0);
          await expect(editor.getByText(/thinking level/i)).toHaveCount(0);
          if (process.env.E2E_SCREENSHOT_DIR) {
            await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
            await screenshot({
              path: path.join(
                process.env.E2E_SCREENSHOT_DIR,
                'thinking-models-page.png',
              ),
            });
          }
          await page.keyboard.press('Escape');
          await page.goto(app);
        }
        await page.reload();
        await page.getByTestId('chat-header-button').click();
        const panel = page.getByTestId('chat-panel');
        const picker = panel.getByTestId('chat-agent-picker');
        await expect(picker).toBeEnabled();
        await picker.click();
        await modelRow('levels').click();
        const menu = page.getByRole('menu');
        const control = page.getByTestId('chat-thinking-control');
        await expect(menu).toBeVisible();
        await expect(control).toBeVisible();
        await expect(page.getByTestId('chat-thinking-menu')).toHaveCount(0);
        await expect(menu.getByRole('button', { name: /done/i })).toHaveCount(
          0,
        );
        await expect(
          control.getByRole('menuitemradio', { name: 'Default', exact: true }),
        ).toBeChecked();
        await expect(control.getByRole('menuitemradio')).toHaveText([
          'Default',
          'Off',
          'Minimal',
          'Low',
          'Medium',
          'High',
          'Extra high',
        ]);
        await control
          .getByRole('menuitemradio', { name: 'High', exact: true })
          .click();
        await expect(
          control.getByRole('menuitemradio', { name: 'High', exact: true }),
        ).toBeChecked();
        if (process.env.E2E_SCREENSHOT_DIR) {
          await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
          await screenshot({
            path: path.join(
              process.env.E2E_SCREENSHOT_DIR,
              `thinking-${width}-levels.png`,
            ),
          });
        }
        await panel
          .getByTestId('chat-message-scroll')
          .click({ position: { x: 8, y: 8 } });
        await expect(menu).toHaveCount(0);
        await expect(
          picker.getByTestId('agent-picker-model-summary'),
        ).toHaveText('· High');
        const modelName = picker.getByTestId('agent-picker-model-name');
        await expect(modelName).toHaveText('Atlas Pro Extended Reasoning');
        const nameGeometry = await modelName.evaluate((node) => ({
          clipped:
            node.scrollWidth > node.clientWidth + 1 ||
            node.scrollHeight > node.clientHeight + 1,
          ellipsis: getComputedStyle(node).textOverflow === 'ellipsis',
        }));
        expect(nameGeometry).toEqual({ clipped: false, ellipsis: false });
        await expect(picker).toHaveAccessibleName(/Thinking level: High/);
        if (process.env.E2E_SCREENSHOT_DIR) {
          await screenshot({
            path: path.join(
              process.env.E2E_SCREENSHOT_DIR,
              `thinking-${width}-summary.png`,
            ),
          });
        }
        await picker.click();
        await expect(
          control.getByRole('menuitemradio', { name: 'High', exact: true }),
        ).toBeChecked();
        await modelRow('many').click();
        await expect(control).toHaveCount(1);
        await expect(
          page
            .locator('[data-model-option="levels"]')
            .getByTestId('chat-thinking-control'),
        ).toHaveCount(0);
        const defaultChoice = control.getByRole('menuitemradio', {
          name: 'Default',
          exact: true,
        });
        await page.mouse.move(0, 0);
        await defaultChoice.focus();
        // The popup may follow the trigger as its summary changes width; Default must stay fixed within the row.
        const defaultOffset = () =>
          defaultChoice.evaluate(
            (node) =>
              node.getBoundingClientRect().x -
              node
                .closest('[data-testid="chat-thinking-control"]')!
                .getBoundingClientRect().x,
          );
        const fixedBefore = await defaultOffset();
        await page.keyboard.press('End');
        await expect(
          control.getByRole('menuitemradio', {
            name: 'Extra high',
            exact: true,
          }),
        ).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(
          control.getByRole('menuitemradio', {
            name: 'Extra high',
            exact: true,
          }),
        ).toBeChecked();
        const fixedAfter = await defaultOffset();
        expect(fixedAfter).toBeCloseTo(fixedBefore, 1);
        const levels = page.getByTestId('chat-thinking-levels');
        const levelGeometry = await levels.evaluate((node) => ({
          overflow: node.scrollWidth - node.clientWidth,
          scroll: node.scrollLeft,
        }));
        if (width === 1440) {
          expect(levelGeometry.overflow).toBeLessThanOrEqual(1);
          expect(levelGeometry.scroll).toBe(0);
        }
        const geometry = await control.evaluate((node) => {
          const row = node.getBoundingClientRect();
          const items = Array.from(
            node.querySelectorAll('[role="menuitemradio"]'),
          ).map((item) => item.getBoundingClientRect());
          return {
            labelsFit: Array.from(
              node.querySelectorAll('[role="menuitemradio"]'),
            ).every((item) => item.scrollWidth <= item.clientWidth + 1),
            sameRow: items.every(
              (item) =>
                item.top >= row.top &&
                item.bottom <= row.bottom &&
                Math.abs(item.top - items[0]!.top) < 5,
            ),
            pageWidth: document.documentElement.scrollWidth,
            viewport: window.innerWidth,
          };
        });
        expect(geometry.sameRow).toBe(true);
        expect(geometry.labelsFit).toBe(true);
        expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewport);
        if (process.env.E2E_SCREENSHOT_DIR) {
          await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
          for (const theme of ['compact', 'default']) {
            for (const dark of [false, true]) {
              await page.evaluate(
                ({ theme, dark }) => {
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.classList.toggle('dark', dark);
                  document.documentElement.classList.toggle('light', !dark);
                  document.documentElement.style.colorScheme = dark
                    ? 'dark'
                    : 'light';
                },
                { theme, dark },
              );
              await screenshot({
                path: path.join(
                  process.env.E2E_SCREENSHOT_DIR,
                  `thinking-${width}-${theme}-${dark ? 'dark' : 'light'}.png`,
                ),
              });
              if (width === 1440) {
                expect(
                  await levels.evaluate(
                    (node) => node.scrollWidth - node.clientWidth,
                  ),
                ).toBeLessThanOrEqual(1);
              }
              expect(
                await levels
                  .getByRole('menuitemradio')
                  .evaluateAll((nodes) =>
                    nodes.every(
                      (node) => node.scrollWidth <= node.clientWidth + 1,
                    ),
                  ),
              ).toBe(true);
            }
          }
        }
        // A model whose id no list names offers every level, and the menu stays open.
        await modelRow('basic').click();
        await expect(menu).toBeVisible();
        await expect(picker).toContainText('Text Basic');
        await expect(control.getByRole('menuitemradio')).toHaveCount(7);
        await control
          .getByRole('menuitemradio', { name: 'Off', exact: true })
          .click();
        await expect(
          picker.getByTestId('agent-picker-model-summary'),
        ).toHaveText('· Off');
        await modelRow('levels').click();
        await expect(
          control.getByRole('menuitemradio', { name: 'High', exact: true }),
        ).toBeChecked();
        await page.keyboard.press('Escape');
        await expect(picker).toBeFocused();
        await panel
          .locator('textarea')
          .fill('Verify inline thinking selection.');
        const created = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            response.url().endsWith('/api/agents/conversations'),
        );
        await panel.getByTestId('chat-send').click();
        const creation = await created;
        expect(creation.request().postDataJSON().config.thinking).toBe('high');
        const conversationId = (await creation.json()).data.id;
        await expect.poll(() => fixture.streams.length).toBe(1);
        fixture.complete(0);
        await expect(panel.getByTestId('chat-stop')).toHaveCount(0);
        const existingPicker = panel.getByTestId('chat-model-picker');
        await expect(existingPicker).toBeEnabled();
        await existingPicker.click();
        await control
          .getByRole('menuitemradio', { name: 'Low', exact: true })
          .click();
        await expect(
          control.getByRole('menuitemradio', { name: 'Low', exact: true }),
        ).toBeChecked();
        const endpoint =
          app + '/api/agents/conversations/' + conversationId + '/config';
        await expect
          .poll(
            async () =>
              (await (await page.request.get(endpoint)).json()).data.thinking,
          )
          .toBe('low');
        await page.goto(app + '/?chat=' + encodeURIComponent(conversationId));
        await expect(panel.getByTestId('chat-model-picker')).toBeEnabled();
        await panel.getByTestId('chat-model-picker').click();
        await expect(
          control.getByRole('menuitemradio', { name: 'Low', exact: true }),
        ).toBeChecked();
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
        if (width === 1440) {
          // The chosen value is the AI SDK's own: the same string in the request, the saved and restored
          // configuration, and what the SDK sends the provider.
          const choices = [
            ['Default', 'provider-default'],
            ['Off', 'none'],
            ['Minimal', 'minimal'],
            ['Low', 'low'],
            ['Medium', 'medium'],
            ['High', 'high'],
            ['Extra high', 'xhigh'],
          ] as const;
          await panel.getByTestId('chat-model-picker').click();
          for (const [label, value] of [...choices.slice(1), choices[0]]) {
            if (label === 'Low') continue;
            const saved = page.waitForResponse(
              (response) =>
                response.request().method() === 'PATCH' &&
                response.url() === endpoint,
            );
            await control
              .getByRole('menuitemradio', { name: label, exact: true })
              .click();
            const response = await saved;
            expect(response.request().postDataJSON().config.thinking).toBe(
              value,
            );
            expect((await response.json()).data.thinking).toBe(value);
            await expect(
              control.getByRole('menuitemradio', { name: label, exact: true }),
            ).toBeChecked();
          }
          await page.keyboard.press('Escape');
          await expect(menu).toHaveCount(0);
          const sendWith = async (label: string, value: string) => {
            await panel.getByTestId('chat-model-picker').click();
            await expect(control).toBeVisible();
            const item = control.getByRole('menuitemradio', {
              name: label,
              exact: true,
            });
            if (!(await item.isChecked())) {
              await item.click();
              await expect
                .poll(
                  async () =>
                    (await (await page.request.get(endpoint)).json()).data
                      .thinking,
                )
                .toBe(value);
            }
            await page.keyboard.press('Escape');
            await expect(menu).toHaveCount(0);
            await panel.locator('textarea').fill(`Think: ${value}`);
            const index = fixture.streams.length;
            await panel.getByTestId('chat-send').click();
            await expect.poll(() => fixture.streams.length).toBe(index + 1);
            fixture.complete(index);
            await expect(panel.getByTestId('chat-stop')).toHaveCount(0);
            return fixture.requests.filter((body) => body.stream).at(-1) as
              Record<string, unknown> | undefined;
          };
          expect(await sendWith('Off', 'none')).toMatchObject({
            reasoning_effort: 'none',
          });
          expect(await sendWith('Extra high', 'xhigh')).toMatchObject({
            reasoning_effort: 'xhigh',
          });
          expect(
            await sendWith('Default', 'provider-default'),
          ).not.toHaveProperty('reasoning_effort');
          await page.goto(app + '/?chat=' + encodeURIComponent(conversationId));
          await panel.getByTestId('chat-model-picker').click();
          await expect(
            control.getByRole('menuitemradio', {
              name: 'Default',
              exact: true,
            }),
          ).toBeChecked();
          expect(
            (await (await page.request.get(endpoint)).json()).data.thinking,
          ).toBe('provider-default');
          const remembered = await page.evaluate(() =>
            Object.entries(window.localStorage)
              .filter(([key]) =>
                key.startsWith('nocobase:agents-chat:thinking'),
              )
              .map(([, value]) => JSON.parse(value) as Record<string, string>),
          );
          expect(
            remembered.some((saved) =>
              Object.values(saved).includes('provider-default'),
            ),
          ).toBe(true);
          await page.keyboard.press('Escape');
        }
        if (width === 412) {
          await panel
            .getByRole('button', { name: 'Close', exact: true })
            .click();
          await page.getByRole('button', { name: 'Open account menu' }).click();
          await page.getByRole('menuitem', { name: /Language/ }).hover();
          await page.getByRole('menuitemradio', { name: /中文/ }).click();
          await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
          await page.goto(app + '/?chat=' + encodeURIComponent(conversationId));
          await panel.getByTestId('chat-model-picker').click();
          await expect(control).toHaveAccessibleName('思考等级：低');
          await expect(
            page.getByTestId('chat-model-picker'),
          ).toHaveAccessibleName(/思考等级：低/);
          await expect(
            page.getByTestId('agent-picker-model-summary'),
          ).toHaveText('· 低');
          await expect(
            control.getByRole('menuitemradio', { name: '默认', exact: true }),
          ).toBeVisible();
          await expect(
            control.getByRole('menuitemradio', { name: '低', exact: true }),
          ).toBeChecked();
          if (process.env.E2E_SCREENSHOT_DIR) {
            await screenshot({
              path: path.join(
                process.env.E2E_SCREENSHOT_DIR,
                'thinking-412-zh-CN.png',
              ),
            });
          }
          await page.goto(app);
          await page.getByRole('button', { name: '打开账户菜单' }).click();
          await page.getByRole('menuitem', { name: /语言/ }).hover();
          await page.getByRole('menuitemradio', { name: /English/ }).click();
          await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
        }
        expect(errors).toEqual([]);
      } finally {
        if (serviceName)
          await page.request.delete(
            app + '/api/agents/services/' + serviceName,
            {
              headers,
            },
          );
        await fixture.close();
      }
    });
  });
}

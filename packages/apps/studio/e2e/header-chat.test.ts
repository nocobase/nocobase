import { mkdirSync } from 'node:fs';
import {
  expect,
  horizontalOverflow,
  open,
  test,
  unique,
} from './support/fixtures.ts';

test.describe('global header Agent', () => {
  test('keeps an upload and one send after switching full-page sessions and returning', async ({
    page,
    api,
  }) => {
    const a = await api.post<{ id: string }>('agents/conversations', {});
    const b = await api.post<{ id: string }>('agents/conversations', {});
    const aTitle = 'Upload session A ' + unique();
    const bTitle = 'Upload session B ' + unique();
    await api.patch(`agents/conversations/${a.id}`, { title: aTitle });
    await api.patch(`agents/conversations/${b.id}`, { title: bTitle });
    await open(page, `/chat/${a.id}`);
    const view = page.getByTestId('chat-page');
    const input = view.getByRole('textbox');
    async function select(title: string): Promise<void> {
      await view.getByTestId('chat-page-history').click();
      await page
        .getByRole('dialog')
        .getByRole('button')
        .filter({ has: page.getByText(title, { exact: true }) })
        .click();
      await expect(view.getByTestId('chat-title')).toHaveText(title);
    }
    for (const conversation of [a, b]) {
      if (conversation === b) await select(bTitle);
      const question = 'Initial question ' + unique();
      await input.fill(question);
      await input.press('Enter');
      await expect(
        view
          .locator('[data-chat-message="user"]')
          .getByText(question, { exact: true }),
      ).toBeVisible();
      await expect(view.getByTestId('chat-submissions')).toHaveCount(0);
      // No runner answers here: stop the run the message queued, so the conversation is idle before the next send.
      await api.post(`agents/conversations/${conversation.id}/stop`, {});
      await expect
        .poll(
          async () =>
            (
              await api.get<{ run: unknown }>(
                `agents/conversations/${conversation.id}`,
              )
            ).run,
        )
        .toBeNull();
    }
    await select(aTitle);
    await select(bTitle);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let uploads = 0;
    let sends = 0;
    await page.route('**/api/agents/chatAttachments', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      uploads += 1;
      await gate;
      await route.continue();
    });
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith(`/conversations/${b.id}/messages`)
      )
        sends += 1;
    });
    const question = 'Question with delayed upload ' + unique();
    try {
      await input.fill(question);
      await view.getByTestId('chat-attach-input').setInputFiles({
        name: 'note.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Session B upload'),
      });
      await expect.poll(() => uploads).toBe(1);
      await page
        .getByRole('navigation', { name: '应用导航' })
        .getByRole('link', { name: '任务', exact: true })
        .click();
      await expect(view).toHaveCount(0);
      await page.goBack();
      await expect(input).toHaveValue(question);
      await expect(view.getByText('note.txt', { exact: true })).toBeVisible();
      await input.press('Enter');
      await input.press('Enter');
      expect(sends).toBe(0);
      release();
      await expect(
        view
          .locator('[data-chat-message="user"]')
          .getByText(question, { exact: true }),
      ).toBeVisible();
      await expect(view.getByTestId('chat-submissions')).toHaveCount(0);
      await expect(input).toHaveValue('');
      expect(uploads).toBe(1);
      expect(sends).toBe(1);
    } finally {
      release();
    }
  });
  test('explains unavailable header targets and preserves the question', async ({
    page,
    api,
  }) => {
    const original = await api.get<Record<string, unknown>>(
      'users/me/preferences',
    );
    let preferences = { ...original };
    await page.route('**/api/users/me/preferences{,/**}', (route) =>
      route.fulfill({ json: { data: preferences } }),
    );
    await page.route('**/api/agents/chatAgents', (route) =>
      route.fulfill({ json: { data: [] } }),
    );
    await page.setViewportSize({ width: 375, height: 812 });
    mkdirSync('storage/ui-workflow/agent-header/screenshots', {
      recursive: true,
    });
    for (const locale of ['zh-CN', 'en-US']) {
      for (const mode of ['light', 'dark']) {
        preferences = { ...original, locale, 'theme.mode': mode };
        await open(page, '/issues');
        const input = page
          .getByTestId('header-chat-mobile')
          .getByRole('textbox');
        await input.fill('Keep this question');
        await input.press('Enter');
        const help =
          locale === 'zh-CN' ? '没有可用 Agent' : 'No agent is available';
        await expect(input).toHaveAccessibleDescription(new RegExp(help));
        await expect(input).toHaveValue('Keep this question');
        await expect(page.getByTestId('chat-panel')).toHaveCount(0);
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
        await page.screenshot({
          path: `storage/ui-workflow/agent-header/screenshots/unavailable-${locale}-${mode}.png`,
        });
      }
    }
    await open(page, '/issues?chat=missing-conversation');
    const panel = page.getByTestId('chat-panel');
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'Close', exact: true }).click();
    const input = page.getByTestId('header-chat-mobile').getByRole('textbox');
    await input.fill('Question for inaccessible conversation');
    await input.press('Enter');
    await expect(input).toHaveAccessibleDescription(
      /This conversation is unavailable/,
    );
    await expect(input).toHaveValue('Question for inaccessible conversation');
    expect(await api.get('users/me/preferences')).toEqual(original);
  });
  test('submits once on an issue page with its context and continues the panel session', async ({
    page,
  }) => {
    await open(page, '/issues/PM-1');
    const input = page.getByTestId('header-chat-desktop').getByRole('textbox');
    await input.pressSequentially('Header ' + unique());
    await input.press('Shift+Enter');
    await input.pressSequentially('second line');
    const question = await input.inputValue();
    let posts = 0;
    let submittedContext: unknown;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        /conversations\/[^/]+\/messages$/u.test(request.url())
      ) {
        posts += 1;
        submittedContext = request.postDataJSON().context;
      }
    });
    await input.press('Enter');
    const panel = page.getByTestId('chat-panel');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('header-chat-desktop')).toHaveCount(0);
    await expect(
      panel
        .locator('[data-chat-message="user"]')
        .getByText(question, { exact: true }),
    ).toBeVisible();
    await expect(panel.locator('[data-testid="chat-submissions"]')).toHaveCount(
      0,
    );
    expect(posts).toBe(1);
    expect(submittedContext).toMatchObject({
      route: '/issues/PM-1',
      items: expect.arrayContaining([
        expect.objectContaining({ kind: 'issue' }),
      ]),
    });
    await panel.getByRole('button', { name: '关闭', exact: true }).click();
    await expect(
      page.getByTestId('header-chat-desktop').getByRole('textbox'),
    ).toBeFocused();
    await page
      .getByRole('button', { name: '在面板中继续编辑', exact: true })
      .click();
    await expect(
      panel
        .locator('[data-chat-message="user"]')
        .getByText(question, { exact: true }),
    ).toHaveCount(1);
  });
  test('a saved question with a lost response is confirmed without a repeated POST', async ({
    page,
  }) => {
    await open(page, '/issues');
    let posts = 0;
    await page.route(
      '**/api/agents/conversations/*/messages',
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        posts += 1;
        await route.fetch();
        await route.abort('failed');
      },
    );
    const question = 'Lost response ' + unique();
    const input = page.getByTestId('header-chat-desktop').getByRole('textbox');
    await input.fill(question);
    await input.press('Enter');
    const panel = page.getByTestId('chat-panel');
    await expect(
      panel
        .locator('[data-chat-message="user"]')
        .getByText(question, { exact: true }),
    ).toBeVisible();
    await expect(panel.getByTestId('chat-submissions')).toHaveCount(0);
    expect(posts).toBe(1);
    await expect(
      panel
        .locator('[data-chat-message="user"]')
        .getByText(question, { exact: true }),
    ).toHaveCount(1);
  });
  test('a lost creation response preserves the question without sending or recreating', async ({
    page,
  }) => {
    await open(page, '/issues');
    let creates = 0;
    let sends = 0;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        /conversations\/[^/]+\/messages$/u.test(request.url())
      )
        sends += 1;
    });
    await page.route('**/api/agents/conversations', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      creates += 1;
      await route.fetch();
      await route.abort('failed');
    });
    const input = page.getByTestId('header-chat-desktop').getByRole('textbox');
    await input.fill('Keep creation question');
    await input.press('Enter');
    const panel = page.getByTestId('chat-panel');
    await expect(
      panel.getByText('会话创建结果待确认', { exact: true }),
    ).toBeVisible();
    await expect(
      panel.getByText('Keep creation question', { exact: true }),
    ).toBeVisible();
    await panel.getByRole('button', { name: '关闭', exact: true }).click();
    await page.setViewportSize({ width: 375, height: 812 });
    await page
      .getByRole('button', { name: '在面板中继续编辑', exact: true })
      .click();
    await expect(
      panel.getByText('Keep creation question', { exact: true }),
    ).toBeVisible();
    expect(creates).toBe(1);
    expect(sends).toBe(0);
  });
  test('preserves independent drafts and supports keep/append across the mobile breakpoint', async ({
    page,
  }) => {
    await open(page, '/issues');
    await page
      .getByRole('button', { name: '在面板中继续编辑', exact: true })
      .click();
    const panel = page.getByTestId('chat-panel');
    await panel
      .getByRole('textbox', { name: '发给 Agent 的消息', exact: true })
      .fill('Panel draft');
    await panel.getByRole('button', { name: '关闭', exact: true }).click();
    await page
      .getByTestId('header-chat-desktop')
      .getByRole('textbox')
      .fill('Header\nquestion');
    await page
      .getByRole('button', { name: '在面板中继续编辑', exact: true })
      .click();
    await panel
      .getByRole('button', { name: '保留面板草稿', exact: true })
      .click();
    await panel.getByRole('button', { name: '关闭', exact: true }).click();
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(
      page.getByTestId('header-chat-mobile').getByRole('textbox'),
    ).toHaveValue('Header\nquestion');
    await page
      .getByRole('button', { name: '在面板中继续编辑', exact: true })
      .click();
    await panel
      .getByRole('button', { name: '追加顶部问题', exact: true })
      .click();
    await expect(
      panel.getByRole('textbox', { name: '发给 Agent 的消息', exact: true }),
    ).toHaveValue('Panel draft\n\nHeader\nquestion');
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(
      panel.getByRole('textbox', { name: '发给 Agent 的消息', exact: true }),
    ).toHaveValue('Panel draft\n\nHeader\nquestion');
  });
  test('header remains editable in both themes, modes, languages and widths', async ({
    page,
    api,
  }) => {
    test.setTimeout(180_000);
    mkdirSync('storage/ui-workflow/agent-header/screenshots', {
      recursive: true,
    });
    const original = await api.get<Record<string, unknown>>(
      'users/me/preferences',
    );
    let preferences = { ...original };
    // Browser-local preferences keep the shared demo account unchanged for parallel tests.
    await page.route('**/api/users/me/preferences{,/**}', async (route) => {
      await route.fulfill({ json: { data: preferences } });
    });
    for (const locale of ['zh-CN', 'en-US'])
      for (const preset of ['default', 'compact'])
        for (const mode of ['light', 'dark']) {
          preferences = {
            ...original,
            locale,
            'theme.preset': preset,
            'theme.mode': mode,
          };
          for (const width of [375, 768, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await open(page, '/issues');
            await expect(page.locator('html')).toHaveAttribute(
              'data-theme',
              preset,
            );
            if (mode === 'dark')
              await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
            else
              await expect(page.locator('html')).not.toHaveClass(/\bdark\b/u);
            const editor = page
              .getByTestId(
                width < 768 ? 'header-chat-mobile' : 'header-chat-desktop',
              )
              .getByRole('textbox');
            await editor.fill('A visible question\n第二行可以编辑');
            await expect(editor).toHaveValue(
              'A visible question\n第二行可以编辑',
            );
            expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
            const box = await editor.boundingBox();
            expect(box!.width).toBeGreaterThan(width < 768 ? 240 : 150);
            expect(
              (await page.getByRole('banner').boundingBox())!.height,
            ).toBeLessThanOrEqual(112);
            await page.screenshot({
              path: `storage/ui-workflow/agent-header/screenshots/${locale}-${preset}-${mode}-${width}.png`,
            });
          }
        }
    expect(await api.get('users/me/preferences')).toEqual(original);
  });
});

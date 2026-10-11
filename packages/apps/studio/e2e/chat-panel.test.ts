import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  expect,
  horizontalOverflow,
  open,
  test,
  unique,
} from './support/fixtures.ts';

const screenshots = path.resolve(
  'storage/ui-workflow/chat-fullscreen/screenshots',
);
const browserAudits: object[] = [];
let consoleErrors = 0;
let failedResponses: number[] = [];

// Keep language/theme changes on the initial administrator, separate from the flow suite's demo account.
test.use({ user: 'admin' });
test.beforeEach(async ({ api, page }, testInfo) => {
  consoleErrors = 0;
  failedResponses = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors += 1;
  });
  page.on('response', (response) => {
    const expected =
      testInfo.title.includes('reused history') &&
      response.status() === 500 &&
      new URL(response.url()).pathname.endsWith('/agents/conversations');
    if (response.status() >= 400 && !expected)
      failedResponses.push(response.status());
  });
  await api.patch('users/me/preferences', {
    locale: 'zh-CN',
    'theme.mode': 'light',
    'theme.preset': 'compact',
  });
});
test.afterEach(async ({ page }, testInfo) => {
  const injectedFailure = testInfo.title.includes('reused history');
  browserAudits.push({
    test: testInfo.title,
    consoleErrors,
    injectedFailure,
    failedResponses,
    pageOpen: !page.isClosed(),
  });
  mkdirSync(screenshots, { recursive: true });
  writeFileSync(
    path.join(screenshots, 'browser-audit.json'),
    JSON.stringify(browserAudits, null, 2),
  );
  expect(failedResponses, 'unexpected failed API responses').toEqual([]);
  // Chromium reports the deliberately injected HTTP 500 as a resource console error.
  if (!injectedFailure) expect(consoleErrors, 'browser console errors').toBe(0);
});

for (const [locale, mode, preset] of [
  ['zh-CN', 'light', 'compact'],
  ['zh-CN', 'dark', 'default'],
  ['en-US', 'light', 'default'],
  ['en-US', 'dark', 'compact'],
] as const) {
  test(`full width preserves drafts and files, switches conversations: ${locale} ${mode} ${preset}`, async ({
    page,
    api,
    context,
  }) => {
    const chinese = locale === 'zh-CN';
    await api.patch('users/me/preferences', {
      locale,
      'theme.mode': mode,
      'theme.preset': preset,
    });
    await context.addInitScript(
      `localStorage.setItem('nocobase.locale', ${JSON.stringify(locale)});` +
        `localStorage.setItem('nocobase:main:theme:color-scheme', ${JSON.stringify(mode)});` +
        `localStorage.setItem('nocobase:main:theme:preset', ${JSON.stringify(preset)});`,
    );
    const first = await api.post<{ id: string }>('agents/conversations', {});
    const second = await api.post<{ id: string }>('agents/conversations', {});
    const title = `Chat panel ${unique()}`;
    await api.patch(`agents/conversations/${first.id}`, {
      title: `${title} A`,
    });
    await api.patch(`agents/conversations/${second.id}`, {
      title: `${title} B`,
    });
    await open(page, `/chat/${first.id}`);
    await expect(page.locator('html')).toHaveClass(new RegExp(mode, 'u'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', preset);
    await page
      .getByRole('button', {
        name: chinese ? '在侧栏中打开' : 'Open in side panel',
      })
      .click();
    const panel = page.getByTestId('chat-panel');
    const originalURL = page.url();
    const draft = panel.getByRole('textbox', {
      name: chinese ? '发给 Agent 的消息' : 'Message to the agent',
      exact: true,
    });
    await draft.pressSequentially('draft 224');
    await panel.locator('input[type=file]').setInputFiles({
      name: 'pm-224.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Chat panel fixture'),
    });
    await expect(panel.getByText('pm-224.txt', { exact: true })).toBeVisible();
    await panel
      .getByRole('button', {
        name: chinese ? '全屏' : 'Full width',
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(originalURL);
    await expect(draft).toHaveValue('draft 224');
    await expect(panel.getByText('pm-224.txt', { exact: true })).toBeVisible();
    const history = panel.getByRole('list', {
      name: chinese ? '对话历史' : 'Conversations',
    });
    await expect(history).toBeVisible();
    await expect(
      history
        .getByRole('button', { name: new RegExp(`${title} A`, 'u') })
        .filter({ hasText: `${title} A` }),
    ).toHaveAttribute('aria-current', 'true');
    const listBox = await history.boundingBox();
    const conversationBox = await panel
      .getByTestId('chat-conversation')
      .boundingBox();
    expect(listBox).not.toBeNull();
    expect(conversationBox).not.toBeNull();
    expect(listBox!.x + listBox!.width).toBeLessThanOrEqual(conversationBox!.x);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    mkdirSync(screenshots, { recursive: true });
    await panel.screenshot({
      path: path.join(screenshots, `${locale}-${mode}-${preset}.png`),
    });
    await panel
      .getByRole('button', {
        name: chinese ? '恢复为侧栏' : 'Back to side panel',
      })
      .click();
    await expect(draft).toHaveValue('draft 224');
    await expect(panel.getByText('pm-224.txt', { exact: true })).toBeVisible();
    await panel
      .getByRole('button', {
        name: chinese ? '全屏' : 'Full width',
        exact: true,
      })
      .click();
    await history
      .getByRole('button', { name: new RegExp(`${title} B`, 'u') })
      .filter({ hasText: `${title} B` })
      .click();
    await expect(panel.getByTestId('chat-title')).toHaveText(`${title} B`);
    await expect(
      history
        .getByRole('button', { name: new RegExp(`${title} B`, 'u') })
        .filter({ hasText: `${title} B` }),
    ).toHaveAttribute('aria-current', 'true');
    await expect(draft).toBeFocused();
    await panel
      .getByRole('button', {
        name: chinese ? '新对话' : 'New conversation',
        exact: true,
      })
      .click();
    await expect(panel.getByTestId('chat-title')).toHaveText(
      chinese ? '新对话' : 'New conversation',
    );
    await expect(history.locator('[aria-current]')).toHaveCount(0);
    await draft.fill('有哪些任务？');
    await panel
      .getByRole('button', { name: chinese ? '发送' : 'Send', exact: true })
      .click();
    await expect(
      panel.getByRole('log', { name: chinese ? '消息' : 'Messages' }),
    ).toContainText('有哪些任务？');
    await expect(page).toHaveURL(originalURL);
  });
}

test('phone history switches back to the conversation without horizontal overflow', async ({
  page,
  api,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const conversation = await api.post<{ id: string }>(
    'agents/conversations',
    {},
  );
  const title = `Chat panel phone ${unique()}`;
  await api.patch(`agents/conversations/${conversation.id}`, { title });
  await open(page, '/issues/PM-1');
  await page.getByTestId('chat-floating-button').click();
  const panel = page.getByRole('dialog', { name: 'Agent 对话' });
  await panel.getByRole('button', { name: '对话历史', exact: true }).click();
  await expect(panel.getByRole('list', { name: '对话历史' })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  mkdirSync(screenshots, { recursive: true });
  await panel.screenshot({ path: path.join(screenshots, 'phone-history.png') });
  await panel
    .getByRole('button', { name: new RegExp(title, 'u') })
    .filter({ hasText: title })
    .click();
  await expect(panel.getByTestId('chat-title')).toHaveText(title);
  const composer = panel.getByRole('textbox', {
    name: '发给 Agent 的消息',
    exact: true,
  });
  await expect(composer).toBeFocused();
  await composer.pressSequentially('phone draft');
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  await panel.screenshot({
    path: path.join(screenshots, 'phone-conversation.png'),
  });
});

test('new conversation keeps page context and supports IME through size changes', async ({
  page,
}) => {
  await open(page, '/issues/PM-1');
  await page.getByTestId('chat-header-button').click();
  const panel = page.getByTestId('chat-panel');
  await panel.getByRole('button', { name: '新对话', exact: true }).click();
  const chips = panel.getByTestId('chat-context-chips');
  await expect(chips).toBeVisible();
  const contextText = await chips.innerText();
  const composer = panel.getByRole('textbox', {
    name: '发给 Agent 的消息',
    exact: true,
  });
  await composer.pressSequentially('Draft ');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.imeSetComposition', {
    text: 'zhong',
    selectionStart: 5,
    selectionEnd: 5,
  });
  await cdp.send('Input.insertText', { text: '中文' });
  await cdp.detach();
  await expect(composer).toHaveValue('Draft 中文');
  await panel.getByRole('button', { name: '全屏', exact: true }).click();
  await expect.poll(() => chips.innerText()).toBe(contextText);
  await expect(composer).toHaveValue('Draft 中文');
  await composer.press('Home');
  await composer.press('ArrowRight');
  await composer.pressSequentially(' edit ');
  await expect(composer).toHaveValue('D edit raft 中文');
  await composer.press('Escape');
  await expect(panel).toHaveAttribute('data-mode', 'docked');
  await expect.poll(() => chips.innerText()).toBe(contextText);
  await expect(composer).toHaveValue('D edit raft 中文');
});

test('the reused history keeps its failure, empty and search states beside the composer', async ({
  page,
}) => {
  await open(page, '/issues/PM-1');
  await page.getByTestId('chat-header-button').click();
  let failing = true;
  await page.route(/\/api\/agents\/conversations(?:\?|$)/u, async (route) => {
    await route.fulfill({
      status: failing ? 500 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        failing
          ? { error: { code: 'INTERNAL_ERROR', message: 'Test failure' } }
          : { data: [], meta: {} },
      ),
    });
  });
  const panel = page.getByTestId('chat-panel');
  await panel.getByRole('button', { name: '全屏', exact: true }).click();
  await expect(panel.getByText('无法加载对话', { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  mkdirSync(screenshots, { recursive: true });
  await panel.screenshot({ path: path.join(screenshots, 'history-error.png') });
  failing = false;
  await panel.getByRole('button', { name: '重试', exact: true }).click();
  await expect(panel.getByText('还没有对话', { exact: true })).toBeVisible();
  await panel.screenshot({ path: path.join(screenshots, 'history-empty.png') });
  await panel
    .getByRole('searchbox', { name: '搜索对话' })
    .pressSequentially('no match');
  await expect(
    panel.getByText('没有匹配的对话', { exact: true }),
  ).toBeVisible();
  await panel
    .getByRole('textbox', { name: '发给 Agent 的消息', exact: true })
    .fill('composer still usable');
  await panel.screenshot({
    path: path.join(screenshots, 'history-no-results.png'),
  });
});

/**
 * The chat composer's composer: pick an agent in its toolbar, send, and land on the conversation full screen (`/chat/:id`).
 * The picker lists the enabled agents, the team's default (the project manager's first choice) to start with, and an
 * agent no runner can take now is disabled with the reason. A coding agent on a runner answers, and none runs here, so
 * the tests check what was sent rather than an answer. The recent conversations under the composer open full screen
 * too, and a conversation moves from there to the side panel.
 */
import { apiAs, expect, open, url, test, unique } from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

interface Conversation {
  readonly id: string;
  readonly title: string | null;
  readonly mode: 'online' | 'runner';
  readonly agent: { readonly name: string } | null;
}

// This file reads the person's recent conversations, so it uses an account no other test opens the chat composer as.
test.use({ user: 'leo' });

test.describe('chat composer', () => {
  test('starts a new conversation from the conversation page at /chat', async ({
    page,
    api,
  }) => {
    const conversation = await api.post<{ id: string }>(
      'agents/conversations',
      {},
    );
    await open(page, `/chat/${conversation.id}`);
    await page
      .getByTestId('chat-page')
      .getByRole('button', { name: '新对话', exact: true })
      .click();
    await expect(page).toHaveURL(url('/chat'));
    await expect(page.getByTestId('chat-composer')).toBeVisible();
    await expect(page.getByTestId('chat-floating-button')).toHaveCount(0);
  });

  test('starts with the team default and disables agents no runner can take', async ({
    page,
  }) => {
    await open(page, '/chat');
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: '今天要做什么？', level: 1 }),
    ).toBeVisible();
    // Nothing but the composer and the recent conversations: no hints for developers, no suggestion chips.
    await expect(main.getByText(/秒级回复：服务端/)).toHaveCount(0);
    // One agent picker in the composer; no Online / Runner switch, no model picker.
    await expect(main.getByRole('group', { name: '模式' })).toHaveCount(0);
    const picker = main.getByTestId('chat-agent-picker');
    // The demo's project manager runs with Opus, which is also the team's default chat agent.
    await expect(picker).toContainText('Claude · Opus 5.5');
    await picker.click();
    const menu = page.getByRole('menu');
    // The demo's runtimes went offline long ago: its agents are listed, but cannot be picked now.
    const sonnet = menu
      .getByRole('menuitem')
      .filter({ hasText: 'Claude · Sonnet 5' });
    await expect(sonnet).toHaveCount(1);
    await expect(sonnet).toHaveAttribute('aria-disabled', 'true');
    await expect(sonnet).toContainText('暂无执行机');
    await page.keyboard.press('Escape');
  });

  test('picks a coding agent in the composer, hands the message to it and opens it full screen', async ({
    page,
    api,
    browser,
  }) => {
    // An agent a team runner has, enabled by an administrator.
    const admin = await apiAs(browser, 'admin');
    let agentName: string;
    try {
      agentName = (
        await new FakeRunner(admin.api, `home-${unique()}`).discovered()
      ).name;
    } finally {
      await admin.close();
    }
    await open(page, '/chat');
    const main = page.getByRole('main');
    const composer = main.getByTestId('chat-composer');
    await composer.getByTestId('chat-agent-picker').click();
    await page
      .getByRole('menu')
      .getByRole('menuitem')
      .filter({ hasText: agentName })
      .click();
    await expect(composer.getByTestId('chat-agent-picker')).toContainText(
      agentName,
    );

    const message = `把导出改成流式 ${unique()}`;
    const send = main.getByRole('button', { name: '发送' });
    await expect(send).toBeDisabled();
    await main.getByRole('textbox', { name: '消息' }).fill(message);
    await send.click();

    // The conversation opens full screen with the message sent; the side panel stays closed.
    await expect(page).toHaveURL(/\/chat\/[^/]+$/u);
    const view = page.getByTestId('chat-page');
    await expect(view.getByText(message).first()).toBeVisible();
    await expect(view.getByTestId('chat-page-agent')).toContainText(agentName);
    await expect(page.getByTestId('chat-panel')).toBeHidden();
    await expect(
      page.getByRole('textbox', { name: '消息', exact: true }),
    ).toHaveCount(0);
    await expect
      .poll(async () => {
        const items = await api.get<Conversation[]>(
          'agents/conversations?pageSize=10',
        );
        const sent = items.find((item) => item.title === message);
        return sent ? [sent.mode, sent.agent?.name] : null;
      })
      .toEqual(['runner', agentName]);
  });

  test('a recent conversation opens full screen and moves to the side panel', async ({
    page,
    api,
  }) => {
    const title = `发布前要检查什么 ${unique()}`;
    const conversation = await api.post<{ id: string }>(
      'agents/conversations',
      {},
    );
    await api.post(`agents/conversations/${conversation.id}/messages`, {
      content: title,
    });
    await api.patch(`agents/conversations/${conversation.id}`, {
      title,
    });

    await open(page, '/chat');
    const recent = page.getByRole('list', { name: '最近的对话' });
    await recent.getByRole('button', { name: new RegExp(title, 'u') }).click();
    await expect(page).toHaveURL(new RegExp(`/chat/${conversation.id}$`, 'u'));
    const view = page.getByTestId('chat-page');
    await expect(view.getByTestId('chat-title')).toHaveText(title);

    // "Open in side panel" docks it beside the page the person came from.
    await view.getByRole('button', { name: '在侧栏中打开' }).click();
    await expect
      .poll(() => new URL(page.url()).pathname.replace(/\/$/u, ''))
      .toBe(new URL(url('/chat')).pathname);
    const panel = page.getByRole('complementary', { name: 'Agent 对话' });
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId('chat-title')).toHaveText(title);

    // Full width keeps the conversation beside its history on the current page.
    const currentURL = page.url();
    await panel.getByRole('button', { name: '全屏', exact: true }).click();
    await expect(page).toHaveURL(currentURL);
    await expect(panel.getByRole('list', { name: '对话历史' })).toBeVisible();
    await expect(
      panel.getByRole('button', { name: '恢复为侧栏' }),
    ).toBeVisible();
  });
});

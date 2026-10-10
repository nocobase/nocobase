/**
 * The home page's composer: pick an agent (online or runner) in its toolbar, send, and land on the conversation full screen
 * (`/chat/:id`). Online is answered on the server by the mock model global setup starts; Runner hands the message to a
 * coding agent on a runner, and none runs here, so the test checks what was sent rather than an answer. The recent
 * conversations under the composer open full screen too, and a conversation moves from there to the side panel.
 */
import { expect, open, server, test, unique } from './support/fixtures.ts';

interface Conversation {
  readonly id: string;
  readonly title: string | null;
  readonly mode: 'online' | 'runner';
  readonly agent: { readonly name: string } | null;
}

// This file reads the person's recent conversations, so it uses an account no other test opens the home page as.
test.use({ user: 'leo' });

test.describe('home composer', () => {
  test('picks a coding agent in the composer, hands the message to it and opens it full screen', async ({
    page,
    api,
  }) => {
    await open(page, '/');
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: '今天要做什么？', level: 1 }),
    ).toBeVisible();
    // Nothing but the composer and the recent conversations: no hints for developers, no suggestion chips.
    await expect(main.getByText(/秒级回复：服务端/)).toHaveCount(0);
    // One agent picker in the composer, listing every agent grouped by type; no Online / Runner switch.
    await expect(main.getByRole('group', { name: '模式' })).toHaveCount(0);
    const composer = main.getByTestId('chat-composer');
    await composer.getByTestId('chat-agent-picker').click();
    const menu = page.getByRole('menu');
    await expect(menu.getByText('在线 Agent')).toBeVisible();
    await expect(menu.getByText('Runner Agent')).toBeVisible();
    await expect(
      menu.getByRole('menuitem').filter({ hasText: '项目助理' }),
    ).toHaveCount(1);
    await menu
      .getByRole('menuitem')
      .filter({ hasText: 'Frontend Developer' })
      .click();
    await expect(composer.getByTestId('chat-agent-picker')).toContainText(
      'Frontend Developer',
    );

    const message = `把导出改成流式 ${unique()}`;
    const send = main.getByRole('button', { name: '发送' });
    await expect(send).toBeDisabled();
    await main.getByRole('textbox', { name: '消息' }).fill(message);
    await send.click();

    // The conversation opens full screen, in Runner mode, with the message sent; the side panel stays closed.
    await expect(page).toHaveURL(/\/chat\/[^/]+$/u);
    const view = page.getByTestId('chat-page');
    await expect(view.getByText(message).first()).toBeVisible();
    await expect(view.getByTestId('chat-mode')).toHaveText('Runner');
    await expect(view.getByTestId('chat-page-agent')).toContainText(
      'Frontend Developer',
    );
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
      .toEqual(['runner', 'Frontend Developer']);
  });

  test('Online sends to the project assistant, who answers on the full-screen page', async ({
    page,
    api,
  }) => {
    await open(page, '/');
    const main = page.getByRole('main');
    // The team's default, an online agent, is chosen to start with.
    await expect(main.getByTestId('chat-agent-picker')).toContainText(
      '项目助理',
    );

    const message = `这周有哪些事在等我处理？ ${unique()}`;
    await main.getByRole('textbox', { name: '消息' }).fill(message);
    await main.getByRole('textbox', { name: '消息' }).press('Enter');

    await expect(page).toHaveURL(/\/chat\/[^/]+$/u);
    const view = page.getByTestId('chat-page');
    await expect(view.getByText(message).first()).toBeVisible();
    await expect(view.getByTestId('chat-mode')).toHaveText('在线');
    const id = new URL(page.url()).pathname.split('/').at(-1);
    const sent = (
      await api.get<Conversation[]>('agents/conversations?pageSize=10')
    ).find((item) => item.id === id);
    expect(sent?.mode).toBe('online');
    const answers = async () =>
      (
        await api.get<{ role: string; content: { content: string } }[]>(
          `agents/conversations/${sent?.id}/messages`,
        )
      ).filter((item) => item.role === 'assistant');
    await expect
      .poll(async () => (await answers()).length, { timeout: 30_000 })
      .toBeGreaterThan(0);
    // The reply shows on the page, without a reload.
    const [answer] = await answers();
    const opening = (answer?.content.content ?? '')
      .replace(/[[\]*_`#>]/gu, '')
      .trim()
      .slice(0, 6);
    await expect(view.getByText(opening, { exact: false }).first()).toBeVisible(
      { timeout: 15_000 },
    );
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

    await open(page, '/');
    const recent = page.getByRole('list', { name: '最近的对话' });
    await recent.getByRole('button', { name: new RegExp(title, 'u') }).click();
    await expect(page).toHaveURL(new RegExp(`/chat/${conversation.id}$`, 'u'));
    const view = page.getByTestId('chat-page');
    await expect(view.getByTestId('chat-title')).toHaveText(title);

    // "Open in side panel" docks it beside the page the person came from.
    await view.getByRole('button', { name: '在侧栏中打开' }).click();
    await expect
      .poll(() => new URL(page.url()).pathname.replace(/\/$/u, ''))
      .toBe(new URL(server.baseURL).pathname);
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

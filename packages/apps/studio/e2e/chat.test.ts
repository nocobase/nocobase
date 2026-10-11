/**
 * Online mode against the mock model global setup starts (`support/mock-llm.ts`, added as the model service
 * `mock-llm`): global setup makes the built-in project assistant an online agent on it and the team's default, so a question from the home page is answered on
 * the server, with no runner, by running Studio's commands in its sandboxed shell, on the full-screen conversation page; intake with
 * AI drafts through it; and the usage page shows what online runs used.
 */
import { expect, open, test, unique, type Api } from './support/fixtures.ts';
import { MOCK_SERVICE } from './support/server.ts';

interface ChatAgent {
  readonly id: string;
  readonly name: string;
  readonly type: 'online' | 'runner';
  readonly isSystemDefault: boolean;
  readonly availability: { readonly online: boolean };
}

interface Price {
  readonly tool: string;
  readonly modelService: string | null;
  readonly model: string;
  readonly inputPerM: number;
  readonly outputPerM: number;
  readonly cacheReadPerM: number;
  readonly cacheWritePerM: number;
  readonly currency: string;
  readonly note: string | null;
}

/** Prices the mock model at the mock service, keeping the other prices. */
async function priceMockModel(api: Api): Promise<void> {
  const { items, subscriptions } = await api.get<{
    items: Price[];
    subscriptions: string[];
  }>('agents/prices');
  if (
    items.some(
      (price) =>
        price.modelService === MOCK_SERVICE.name &&
        price.model === 'mock-model',
    )
  )
    return;
  await api.put('agents/prices', {
    subscriptions,
    prices: [
      ...items.map((price) => ({
        tool: price.tool,
        modelService: price.modelService,
        model: price.model,
        inputPerM: price.inputPerM,
        outputPerM: price.outputPerM,
        cacheReadPerM: price.cacheReadPerM,
        cacheWritePerM: price.cacheWritePerM,
        currency: price.currency,
        note: price.note,
      })),
      {
        tool: 'online',
        modelService: MOCK_SERVICE.name,
        model: 'mock-model',
        inputPerM: 2,
        outputPerM: 8,
        currency: 'USD',
      },
    ],
  });
}

test.describe('Online mode', () => {
  test('the project assistant answers on the server, reads knowledge and links it', async ({
    page,
    api,
  }) => {
    const agents = await api.get<ChatAgent[]>('agents/chatAgents');
    // The built-in agent's stored name is English; the interface shows it as 项目助理.
    const pm = agents.find((agent) => agent.isSystemDefault);
    expect(pm).toMatchObject({
      name: 'Project assistant',
      type: 'online',
      availability: { online: true },
    });

    await open(page, '/');
    await expect(
      page.getByRole('heading', { name: '今天要做什么？' }),
    ).toBeVisible();
    const question = `What is our release process? ${unique()}`;
    const composer = page.getByRole('main');
    await composer.getByRole('textbox', { name: '消息' }).fill(question);
    await composer.getByRole('button', { name: '发送' }).click();

    // The conversation opens full screen, in Online mode, and the answer cites the document it read.
    await expect(page).toHaveURL(/\/chat\/[^/]+$/u);
    const view = page.getByTestId('chat-page');
    const answer = view.getByRole('link', { name: 'Team conventions' }).last();
    await expect(answer).toBeVisible({ timeout: 30_000 });
    await expect(answer).toHaveAttribute('href', /knowledge/u);
    await expect(view.getByTestId('chat-mode')).toHaveText('在线');

    // The run took no runner: it was held by the application and used the mock model's tokens.
    const conversations = await api.get<
      { id: string; mode: string; title: string | null }[]
    >('agents/conversations?pageSize=5');
    expect(conversations[0]?.mode).toBe('online');
  });

  test('AI split drafts the issues through the online agent, with no runner', async ({
    page,
  }) => {
    const tag = unique();
    await open(page, '/issues/new');
    const dialog = page.getByRole('dialog', { name: '新建任务' });
    await dialog
      .getByRole('textbox', { name: '需求' })
      .fill(`# 导出改进 ${tag}\n- 导出 CSV ${tag}\n- 导出 Excel ${tag}`);
    // The request is handed to the project assistant's conversation in the side panel and the dialog closes.
    await dialog.getByRole('button', { name: '让 Agent 整理' }).click();

    await expect(dialog).toBeHidden({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/issues(\?|$)/);
    const panel = page.getByTestId('chat-panel');
    await expect(panel.getByText(`导出 Excel ${tag}`).first()).toBeVisible({
      timeout: 30_000,
    });
    // One conversation, one panel.
    await expect(page.getByRole('dialog', { name: '新建任务' })).toHaveCount(0);
  });

  test('the usage page shows what online runs used, by agent type', async ({
    page,
    api,
  }) => {
    await priceMockModel(api);
    // An online run of its own, so the report has something whatever ran before.
    const conversation = await api.post<{ id: string }>(
      'agents/conversations',
      {},
    );
    await api.post(`agents/conversations/${conversation.id}/messages`, {
      content: '有哪些任务？',
    });
    await expect
      .poll(
        async () =>
          (
            await api.get<{ role: string }[]>(
              `agents/conversations/${conversation.id}/messages`,
            )
          ).filter((message) => message.role === 'assistant').length,
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);

    await open(page, '/usage?groupBy=type');
    await expect(page.getByRole('table')).toContainText('在线', {
      timeout: 15_000,
    });
  });
});

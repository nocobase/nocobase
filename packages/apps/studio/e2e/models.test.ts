/**
 * Agent team › Models against the mock model global setup starts (`support/mock-llm.ts`): adding an OpenAI-compatible
 * service in one sheet (provider type, name, base URL, key, connection test, models fetched and one checked) beside the
 * `mock-llm` one global setup added; reopened, its key shown as set and never again; the (service, model) pair priced
 * on the Usage page's Prices tab; and an online agent created on the service's model.
 */
import { expect, open, server, test, unique } from './support/fixtures.ts';
import { MOCK_SERVICE } from './support/server.ts';

interface ServiceView {
  readonly name: string;
  readonly title: string;
  readonly apiKeySet: boolean;
  readonly models: readonly { readonly value: string }[];
}

interface Price {
  readonly tool: string;
  readonly modelService: string | null;
  readonly model: string;
  readonly inputPerM: number;
  readonly outputPerM: number;
}

test.describe('Agent team › Models', () => {
  test('adds a service, turns on and prices its model, tests it, and gives an online agent its model', async ({
    page,
    api,
  }) => {
    const llmUrl = server.llm?.url;
    test.skip(!llmUrl, 'The mock model runs only when global setup starts it.');

    await open(page, '/models');
    const services = page.getByRole('table', { name: '模型服务' });
    await expect(
      services.getByRole('row', { name: MOCK_SERVICE.title }),
    ).toBeVisible();

    // A service is the unit: another OpenAI-compatible one is added beside any that exist, in one sheet.
    await page.getByRole('button', { name: '添加服务' }).click();
    const sheet = page.getByRole('dialog', { name: '添加模型服务' });
    await sheet.getByRole('combobox', { name: '服务商类型' }).click();
    await page.getByRole('option', { name: 'OpenAI-compatible' }).click();
    const title = `Mock 兼容 ${unique()}`;
    await sheet.getByLabel('名称').fill(title);
    await sheet.getByLabel('Base URL').fill(llmUrl!);
    await sheet.getByLabel('API 密钥').fill('mock-key');
    await sheet.getByRole('button', { name: '获取模型' }).click();
    await sheet
      .getByRole('list', { name: '模型' })
      .getByRole('checkbox', { name: 'mock-model' })
      .click();
    await sheet.getByRole('button', { name: '测试连接' }).click();
    await expect(
      sheet.getByRole('status').filter({ hasText: '连接成功' }),
    ).toHaveText('连接成功：mock-model 有回应。');
    await sheet.getByRole('button', { name: '保存', exact: true }).click();
    await expect(sheet).toBeHidden();

    // Reopened, the key is set and never shown again.
    await services.getByRole('button', { name: `编辑 ${title}` }).click();
    const edit = page.getByRole('dialog', { name: title });
    await expect(edit.getByLabel('API 密钥')).toHaveAttribute(
      'placeholder',
      '已设置，留空则保持不变',
    );
    await expect(edit.getByLabel('API 密钥')).toHaveValue('');
    await edit.getByRole('button', { name: '取消' }).click();

    // The Usage page's prices sheet lists the (service, model) pair at once.
    await open(page, '/usage?prices=1');
    const priced = `${title} · mock-model`;
    const pair = page
      .getByRole('table', { name: '在线（模型服务）' })
      .getByRole('row', { name: priced });
    await expect(pair).toContainText('未定价');
    await pair
      .getByRole('textbox', { name: `${priced} 每百万 token 的输入价格` })
      .fill('2');
    await pair
      .getByRole('textbox', { name: `${priced} 每百万 token 的输出价格` })
      .fill('8');
    await pair.getByRole('button', { name: `保存 ${priced} 的价格` }).click();

    const items = await api.get<ServiceView[]>('agents/services');
    const added = items.find((service) => service.title === title);
    expect(added).toMatchObject({ apiKeySet: true });
    // The key is write-only: no answer carries it.
    expect(JSON.stringify(items)).not.toContain('mock-key');
    expect(items.map((service) => service.name)).toContain(MOCK_SERVICE.name);
    // The price belongs to the service and the model together.
    const prices = await api.get<{ items: Price[] }>('agents/prices');
    expect(
      prices.items.find(
        (price) =>
          price.modelService === added!.name && price.model === 'mock-model',
      ),
    ).toMatchObject({ tool: 'online', inputPerM: 2, outputPerM: 8 });

    // Online agents are offered the new service's model.
    await expect
      .poll(
        async () =>
          (await api.get<{ name: string }[]>('agents/models')).map(
            (service) => service.name,
          ),
        { timeout: 10_000 },
      )
      .toContain(added!.name);

    // An online agent picks the service and its model.
    const agentName = `模型助手 ${unique()}`;
    await open(page, '/agents/new');
    const create = page.getByRole('dialog');
    await create.getByRole('radio', { name: /^在线/u }).click();
    await create.getByLabel('名称', { exact: true }).fill(agentName);
    const field = (label: string) =>
      create.getByRole('combobox', { name: label, exact: true });
    await field('模型服务').click();
    await page.getByRole('option', { name: added!.title }).click();
    await expect(field('模型')).toContainText('mock-model');
    await create.getByRole('button', { name: '创建', exact: true }).click();
    await expect
      .poll(async () => {
        const agents = await api.get<
          {
            name: string;
            type: string;
            modelEntries: { modelService?: string; model: string | null }[];
          }[]
        >('agents');
        return agents.find((agent) => agent.name === agentName);
      })
      .toMatchObject({
        type: 'online',
        modelEntries: [{ modelService: added!.name, model: 'mock-model' }],
      });
  });

  test('bills a coding tool by subscription', async ({ page, api }) => {
    await open(page, '/usage?prices=1');
    await page
      .getByRole('list', { name: 'Runner（编码工具）' })
      .getByRole('button', { name: /Pi/u })
      .click();
    const subscription = page.getByRole('switch', {
      name: /包月\/订阅（不计费）/u,
    });
    const before = await subscription.isChecked();
    await subscription.click();
    await expect
      .poll(async () =>
        (
          await api.get<{ subscriptions: string[] }>('agents/prices')
        ).subscriptions.includes('pi'),
      )
      .toBe(!before);
    await subscription.click();
  });
});

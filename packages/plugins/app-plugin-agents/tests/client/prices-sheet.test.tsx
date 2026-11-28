// @vitest-environment jsdom
/**
 * The Usage page's Prices tab: the enabled services' (service, model) pairs and the coding tools, edited in place,
 * shown to who reads `agents.prices`.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ModelServiceView } from '../../shared/models.js';
import type { ModelPrice, PricesAnswer } from '../../shared/reports.js';
import { api, callsTo, clientMocks, resetApi } from './fake-client.js';
import { renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: UsagePage } =
  await import('../../client/pages/usage/index.js');

const ALL = [
  'agents.services/read',
  'agents.services/manage',
  'agents.prices/read',
  'agents.prices/manage',
];

const DAY = '2026-10-01';
const zero = {
  key: 'total',
  name: null,
  runs: 0,
  durationMs: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
  cost: null,
  pricedRuns: 0,
};
const emptyUsage = {
  from: DAY,
  to: DAY,
  groupBy: 'agent',
  rows: [],
  totals: zero,
  daily: [],
  unpricedModels: [],
};

const state = {
  services: [] as ModelServiceView[],
  prices: { items: [], subscriptions: [], seen: [] } as PricesAnswer,
};

function serve(permissions: readonly string[] = ALL): void {
  resetApi(
    {
      'agents/services': () => state.services,
      'agents/models': ({ query }) =>
        state.services
          .filter((service) => service.enabled)
          .map((service) => ({
            ...service,
            models: service.models.filter(
              (model) => (model.kind ?? 'chat') === (query.kind ?? 'chat'),
            ),
          }))
          .filter((service) => service.models.length > 0),
      'POST agents/services': () => ({ ...state.services[0], name: 'new' }),
      'PATCH agents/services/team': () => state.services[0],
      'POST agents/discoverModels': () => ({
        ok: true,
        items: [
          { id: 'mock-mini', kind: 'chat' },
          { id: 'mock-model', kind: 'chat' },
        ],
      }),
      'POST agents/checkConnection': () => ({ ok: true, message: null }),
      'agents/prices': () => state.prices,
      'agents/usage': () => emptyUsage,
      'agents/usage/models': () => ({ from: DAY, to: DAY, rows: [] }),
      'agents/vocabulary': () => ({ subjects: [], sources: [], scopes: [] }),
      agents: () => [],
      'agents/users': () => [],
      'PUT agents/prices': () => state.prices,
    },
    permissions,
  );
}

const sent = (method: string, path: string): unknown[] =>
  callsTo(method, path).map((call) => call.json);

function service(extra: Partial<ModelServiceView> = {}): ModelServiceView {
  return {
    name: 'team',
    title: 'Team',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:9999/v1',
    apiKeySet: true,
    enabled: true,
    models: [{ value: 'mock-model', label: 'mock-model' }],
    ...extra,
  };
}

function price(extra: Partial<ModelPrice>): ModelPrice {
  return {
    id: 'p1',
    tool: 'online',
    modelService: 'team',
    model: 'mock-model',
    inputPerM: 3,
    outputPerM: 15,
    cacheReadPerM: 0,
    cacheWritePerM: 0,
    currency: 'USD',
    note: null,
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...extra,
  };
}

const renderPrices = () =>
  renderRoute(<UsagePage />, '/usage', '/usage?prices=1');

describe('Agent management › Usage › Prices', () => {
  it('shows the prices in a tab of the usage page', async () => {
    renderRoute(<UsagePage />, '/usage', '/usage');
    expect(screen.queryByTestId('usage-prices')).toBeNull();
    await userEvent.click(
      await screen.findByRole('tab', { name: 'usage.tabs.prices' }),
    );
    const panel = await screen.findByTestId('usage-prices');
    expect(
      await within(panel).findByRole('list', { name: 'prices.section.runner' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  beforeEach(() => {
    state.services = [];
    state.prices = { items: [], subscriptions: [], seen: [] };
    serve();
  });

  it('prices the enabled services’ models by service and model', async () => {
    state.services = [
      service(),
      service({ name: 'lab', title: 'Lab' }),
      service({ name: 'off', title: 'Off', enabled: false }),
    ];
    state.prices = {
      items: [price({ modelService: 'lab', inputPerM: 9 })],
      subscriptions: [],
      seen: [],
    };
    renderPrices();
    const online = await screen.findByRole('table', {
      name: 'prices.section.online',
    });
    const rows = (await within(online).findAllByRole('row')).slice(1);
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Team · mock-model',
      'Lab · mock-model',
    ]);
    expect(
      within(rows[1]!).getByRole('textbox', {
        name: /prices\.price\.inputOf/u,
      }),
    ).toHaveValue('9');
    expect(within(rows[0]!).getByText('prices.price.unpriced')).toBeVisible();

    await userEvent.type(
      within(rows[0]!).getByRole('textbox', {
        name: /prices\.price\.inputOf/u,
      }),
      '2',
    );
    await userEvent.type(
      within(rows[0]!).getByRole('textbox', {
        name: /prices\.price\.outputOf/u,
      }),
      '8{Enter}',
    );
    await waitFor(() =>
      expect(sent('PUT', 'agents/prices')[0]).toEqual(
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({
              tool: 'online',
              modelService: 'team',
              model: 'mock-model',
              inputPerM: 2,
              outputPerM: 8,
            }),
          ]),
        }),
      ),
    );
  });

  it('prices a coding tool’s models by its rules and bills it by subscription', async () => {
    state.prices = {
      items: [
        price({
          id: 'r1',
          tool: 'claude',
          modelService: null,
          model: 'claude-*',
        }),
      ],
      subscriptions: [],
      seen: [{ tool: 'claude', model: 'claude-opus-5' }],
    };
    renderPrices();
    const tools = await screen.findByRole('list', {
      name: 'prices.section.runner',
    });
    await userEvent.click(
      within(tools).getByRole('button', { name: /tools\.claude/u }),
    );
    const row = await screen.findByRole('row', { name: 'claude-opus-5' });
    expect(
      within(row).getByText('prices.price.via(pattern=claude-*)'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('switch', { name: 'prices.tool.subscription' }),
    );
    await waitFor(() =>
      expect(sent('PUT', 'agents/prices')[0]).toEqual(
        expect.objectContaining({ subscriptions: ['claude'] }),
      ),
    );
  });

  it('hides online prices with no chat models and preserves them when saving a coding tool', async () => {
    state.services = [
      service({
        models: [{ value: 'embedding', label: 'Embedding', kind: 'embedding' }],
      }),
    ];
    state.prices = { items: [price({})], subscriptions: [], seen: [] };
    serve(['agents.prices/read', 'agents.prices/manage']);
    renderPrices();
    const tools = await screen.findByRole('list', {
      name: 'prices.section.runner',
    });
    expect(screen.queryByText('prices.section.online')).toBeNull();
    await userEvent.click(
      within(tools).getByRole('button', { name: /tools\.claude/u }),
    );
    await userEvent.click(
      screen.getByRole('switch', { name: 'prices.tool.subscription' }),
    );
    await waitFor(() =>
      expect(sent('PUT', 'agents/prices')[0]).toMatchObject({
        subscriptions: ['claude'],
        prices: [
          expect.objectContaining({
            tool: 'online',
            modelService: 'team',
            model: 'mock-model',
          }),
        ],
      }),
    );
  });

  it('offers no prices for who does not read them', async () => {
    serve(['agents.services/read']);
    renderPrices();
    expect(screen.queryByRole('tab', { name: 'usage.tabs.prices' })).toBeNull();
    expect(screen.queryByTestId('usage-prices')).toBeNull();
    await waitFor(() =>
      expect(api.calls.some((call) => call.path === 'agents/prices')).toBe(
        false,
      ),
    );
  });
});

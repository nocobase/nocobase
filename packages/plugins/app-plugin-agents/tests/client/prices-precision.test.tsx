// @vitest-environment jsdom
/** Price editing through the real client runtime and an in-memory API, without a browser or database. */
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import agents from '../../client/plugin.js';
import { PricesSheet } from '../../client/pages/usage/prices/index.js';
import type { ModelCatalog } from '../../shared/models.js';
import type {
  ModelPrice,
  PricesAnswer,
  PricesInput,
} from '../../shared/reports.js';

const label = 'Team · tiny-chat';
const inputName = `Input price of ${label}, per million tokens`;
const outputName = `Output price of ${label}, per million tokens`;
const saveName = `Save the price of ${label}`;

function price(extra: Partial<ModelPrice> = {}): ModelPrice {
  return {
    id: 'p1',
    tool: 'online',
    modelService: 'team',
    model: 'tiny-chat',
    inputPerM: 1e-7,
    outputPerM: 0.123456789,
    cacheReadPerM: 0.01,
    cacheWritePerM: 0.02,
    currency: 'USD',
    note: 'Keep this note',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...extra,
  };
}

function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open prices</button>
      <PricesSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

async function setup(items: ModelPrice[] = [], canManage = true) {
  let stored: PricesAnswer = { items, subscriptions: ['claude'], seen: [] };
  const requests: ApiCall[] = [];
  const writes: PricesInput[] = [];
  const service: ModelCatalog['services'][number] = {
    name: 'team',
    title: 'Team',
    provider: 'openai-compatible',
    models: [
      { value: 'tiny-chat', label: 'Tiny', kind: 'chat', dimensions: null },
    ],
  };
  const fetch = answerApi((call) => {
    requests.push(call);
    if (call.path === 'authorization/permissions')
      return {
        data: {
          unrestricted: false,
          permissions: [
            {
              resource: { type: 'settings', id: 'agents.prices' },
              actions: canManage ? ['read', 'manage'] : ['read'],
            },
          ],
        },
      };
    if (call.path === 'agents/models') return { data: [service] };
    if (call.path === 'agents/prices') {
      if (call.method === 'PUT') {
        const body = call.json as PricesInput;
        writes.push(body);
        stored = {
          ...stored,
          items: body.prices.map((item, index) => ({
            ...price(),
            ...item,
            id: `p${index + 1}`,
            modelService: item.modelService ?? null,
            updatedAt: new Date(
              Date.UTC(2026, 9, 1, 0, 0, writes.length),
            ).toISOString(),
          })),
          subscriptions: [...body.subscriptions],
        };
      }
      return { data: stored };
    }
    return new Response(null, { status: 404 });
  });
  const mount = () =>
    renderWithApp(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Harness />
      </QueryClientProvider>,
      {
        namespace: '@nocobase/app-plugin-agents',
        plugins: [agents()],
        fetch,
        services: (app) => {
          app.container.singleton(
            authorizationClientToken,
            (resolver) =>
              new AuthorizationClient(resolver.resolve(apiClientToken)),
          );
        },
      },
    );
  let view = await mount();
  return {
    writes,
    requests,
    stored: () => stored,
    async reload() {
      view.unmount();
      view = await mount();
    },
  };
}

beforeEach(() => window.localStorage.clear());

describe('price precision', () => {
  it.each(
    [1e-7, 0.123456789, 0, 0.123456].flatMap((value) =>
      (['input', 'output'] as const).map((untouched) => ({ value, untouched })),
    ),
  )(
    'preserves $untouched = $value when only the other price changes after reload',
    async ({ value, untouched }) => {
      const other = price({
        id: 'other',
        modelService: 'other',
        model: 'other',
      });
      const env = await setup([other]);
      const first =
        untouched === 'input'
          ? { inputPerM: value, outputPerM: 0.25 }
          : { inputPerM: 0.25, outputPerM: value };
      const text = (amount: number) =>
        amount === 1e-7 ? '0.0000001' : String(amount);
      await userEvent.type(
        await screen.findByRole('textbox', { name: inputName }),
        text(first.inputPerM),
      );
      await userEvent.type(
        screen.getByRole('textbox', { name: outputName }),
        text(first.outputPerM),
      );
      await userEvent.click(screen.getByRole('button', { name: saveName }));
      await waitFor(() => expect(env.writes).toHaveLength(1));
      expect(env.writes[0]?.prices).toContainEqual(
        expect.objectContaining(first),
      );
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: saveName })).toBeNull(),
      );

      // A fresh client and query cache model a reload from the saved API answer.
      await env.reload();
      const input = await screen.findByRole('textbox', { name: inputName });
      const output = screen.getByRole('textbox', { name: outputName });
      expect(input).toHaveValue(String(first.inputPerM));
      expect(output).toHaveValue(String(first.outputPerM));
      expect(
        env.requests.filter(
          (call) => call.path === 'agents/prices' && call.method === 'GET',
        ),
      ).toHaveLength(2);
      const edited = untouched === 'input' ? output : input;
      await userEvent.clear(edited);
      await userEvent.type(edited, '0.5{Enter}');
      await waitFor(() => expect(env.writes).toHaveLength(2));
      const expected =
        untouched === 'input'
          ? { inputPerM: value, outputPerM: 0.5 }
          : { inputPerM: 0.5, outputPerM: value };
      expect(env.writes[1]?.prices).toContainEqual(
        expect.objectContaining(expected),
      );
      expect(
        env.stored().items.find((item) => item.modelService === 'team'),
      ).toMatchObject(expected);
      expect(
        env.writes[1]?.prices.find((item) => item.modelService === 'other'),
      ).toMatchObject({
        inputPerM: other.inputPerM,
        outputPerM: other.outputPerM,
        cacheReadPerM: other.cacheReadPerM,
        cacheWritePerM: other.cacheWritePerM,
        note: other.note,
      });
      expect(env.writes[1]?.subscriptions).toEqual(['claude']);
    },
  );

  it('discards an unsaved edit on close and restores both precise saved amounts on reopen', async () => {
    const saved = price();
    const env = await setup([saved]);
    const input = await screen.findByRole('textbox', { name: inputName });
    await userEvent.clear(input);
    await userEvent.type(input, '9');
    const output = screen.getByRole('textbox', { name: outputName });
    await userEvent.clear(output);
    await userEvent.type(output, '8');
    await userEvent.click(
      screen.getByRole('button', { name: 'Close', exact: true }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(env.writes).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Open prices' }));
    expect(await screen.findByRole('textbox', { name: inputName })).toHaveValue(
      '1e-7',
    );
    expect(screen.getByRole('textbox', { name: outputName })).toHaveValue(
      '0.123456789',
    );
    expect(screen.queryByRole('button', { name: saveName })).toBeNull();
    expect(env.stored().items).toEqual([saved]);
  });

  it.each(['-1', 'Infinity', 'NaN', '1e309'])(
    'refuses %s on either side, including Enter',
    async (invalid) => {
      const env = await setup([price()]);
      for (const name of [inputName, outputName]) {
        const box = await screen.findByRole('textbox', { name });
        const previous = (box as HTMLInputElement).value;
        await userEvent.clear(box);
        await userEvent.type(box, invalid);
        expect(box).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('button', { name: saveName })).toBeDisabled();
        await userEvent.keyboard('{Enter}');
        expect(env.writes).toEqual([]);
        await userEvent.clear(box);
        await userEvent.type(box, previous);
      }
    },
  );

  it('keeps zero valid and an empty counterpart as zero', async () => {
    const env = await setup();
    await userEvent.type(
      await screen.findByRole('textbox', { name: inputName }),
      '0{Enter}',
    );
    await waitFor(() => expect(env.writes).toHaveLength(1));
    expect(env.writes[0]?.prices).toEqual([
      expect.objectContaining({ inputPerM: 0, outputPerM: 0 }),
    ]);
  });

  it('keeps existing read-only formatting and offers no editing without manage permission', async () => {
    const env = await setup([price()], false);
    const row = await screen.findByRole('row', { name: label });
    expect(within(row).queryAllByRole('textbox')).toEqual([]);
    expect(within(row).queryAllByRole('button')).toEqual([]);
    expect(within(row).getByText('0', { exact: true })).toBeVisible();
    expect(within(row).getByText('0.123457', { exact: true })).toBeVisible();
    expect(env.writes).toEqual([]);
  });
});

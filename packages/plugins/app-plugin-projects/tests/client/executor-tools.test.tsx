import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import projects from '../../client/plugin.js';
import { PmExecutorSelect } from '../../client/components/pm-executor-select.js';
import { StartDialog } from '../../client/pages/issues/detail/start-dialog.js';
import type { Executor } from '../../shared/issues.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { me } from './fake-client.js';
import { executorOf } from '../../client/kit/plans/lookup.js';

const tools = [
  { id: 'codex', name: 'Codex', model: 'model-one' },
  { id: 'other', name: 'Other tool', model: 'model-two' },
];

const fetch = answerApi(({ path, query }) => {
  if (path === 'projects/me') return { data: me('admin') };
  if (path.endsWith('/tools'))
    return { data: tools, meta: { total: tools.length } };
  if (path.endsWith('/availability'))
    return {
      data:
        query?.tool === 'other'
          ? {
              status: 'unavailable',
              runnerName: null,
              reason: '⚠ No online runner with Other tool',
            }
          : { status: 'available', runnerName: 'Lima', reason: null },
    };
  return new Response(null, { status: 404 });
});

const options = {
  plugins: [projects({ routes: false })],
  namespace: ACCESS_NAMESPACE,
  fetch,
  services: (app: ClientApplication) =>
    app.container.singleton(
      authorizationClientToken,
      (resolver) => new AuthorizationClient(resolver.resolve(apiClientToken)),
    ),
};

describe('executor tool controls', () => {
  it('preserves a plan executor’s tool and source when editing', () => {
    expect(
      executorOf({ type: 'bot', id: 'b1', tool: 'codex', toolSource: 'rule' }),
    ).toEqual({ type: 'bot', id: 'b1', tool: 'codex', toolSource: 'rule' });
  });

  it('lets the confirmation choose the tool before assigning without starting', async () => {
    const decide = vi.fn();
    await renderWithApp(
      <StartDialog
        request={{
          kind: 'bot',
          names: ['Worker'],
          executor: { type: 'bot', id: 'b1' },
        }}
        onDecide={decide}
        onCancel={() => undefined}
      />,
      options,
    );
    await userEvent.click(
      await screen.findByRole('combobox', { name: 'Tool' }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'Other tool' }),
    );
    expect(
      await screen.findByText('model-two · ⚠ No online runner with Other tool'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Assign only, do not start' }),
    );
    expect(decide).toHaveBeenCalledWith(false, {
      type: 'bot',
      id: 'b1',
      tool: 'other',
      toolSource: 'explicit',
    });
  });
  it('shows model and availability and submits the selected tool', async () => {
    const changed = vi.fn();
    function Selector(): ReactElement {
      const [value, setValue] = useState<Executor | null>({
        type: 'bot',
        id: 'b1',
        tool: 'codex',
      });
      return (
        <PmExecutorSelect
          value={value}
          members={[]}
          others={[{ type: 'bot', id: 'b1', name: 'Worker' }]}
          aria-label='Executor'
          onChange={(next) => {
            changed(next);
            setValue(next);
          }}
        />
      );
    }
    await renderWithApp(<Selector />, options);
    expect(
      await screen.findByText('model-one · Available (Lima)'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Tool' }));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Other tool' }),
    );
    expect(changed).toHaveBeenLastCalledWith({
      type: 'bot',
      id: 'b1',
      tool: 'other',
      toolSource: 'explicit',
    });
    expect(
      await screen.findByText('model-two · ⚠ No online runner with Other tool'),
    ).toBeInTheDocument();
  });

  it('clears the previous tool when selecting a different executor', async () => {
    const changed = vi.fn();
    await renderWithApp(
      <PmExecutorSelect
        value={{ type: 'bot', id: 'b1', tool: 'codex' }}
        members={[]}
        others={[
          { type: 'bot', id: 'b1', name: 'Worker' },
          { type: 'bot', id: 'b2', name: 'Other worker' },
        ]}
        aria-label='Executor'
        onChange={changed}
      />,
      options,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Executor' }));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Other worker' }),
    );
    expect(changed).toHaveBeenCalledWith({ type: 'bot', id: 'b2' });
  });

  it('hides tools for a kind without both optional methods', async () => {
    const handler = vi.fn(() => ({ data: [], meta: { total: 0 } }));
    await renderWithApp(
      <PmExecutorSelect
        value={{ type: 'bot', id: 'b1' }}
        members={[]}
        others={[{ type: 'bot', id: 'b1', name: 'Worker' }]}
        onChange={() => undefined}
      />,
      { ...options, fetch: answerApi(handler) },
    );
    await waitFor(() => expect(handler).toHaveBeenCalled());
    expect(
      screen.queryByRole('combobox', { name: 'Tool' }),
    ).not.toBeInTheDocument();
  });
});

describe.each([
  {
    locale: 'en-US',
    start: 'Start execution',
    later: 'Assign only, do not start',
    available: 'Available (Lima)',
  },
  {
    locale: 'zh-CN',
    start: '开始执行',
    later: '只指派，不开始',
    available: '可用（Lima）',
  },
])(
  'assignment confirmation in $locale',
  ({ locale, start, later, available }) => {
    it.each([true, false])(
      'sends start=%s and shows the tool model and runner',
      async (shouldStart) => {
        const decide = vi.fn();
        await renderWithApp(
          <StartDialog
            request={{
              kind: 'bot',
              names: ['Worker'],
              executor: { type: 'bot', id: 'b1', tool: 'codex' },
            }}
            onDecide={decide}
            onCancel={() => undefined}
          />,
          { ...options, locale },
        );
        expect(
          await screen.findByText(`model-one · ${available}`),
        ).toBeInTheDocument();
        await userEvent.click(
          screen.getByRole('button', { name: shouldStart ? start : later }),
        );
        expect(decide).toHaveBeenCalledWith(shouldStart, {
          type: 'bot',
          id: 'b1',
          tool: 'codex',
        });
      },
    );
  },
);

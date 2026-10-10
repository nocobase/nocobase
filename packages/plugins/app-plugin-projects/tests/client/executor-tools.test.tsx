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
  { id: 'codex', name: 'Codex', model: 'model-one', isDefault: true },
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
  it.each([true, false])(
    'previews a sole default tool and confirms with default source, start=%s',
    async (start) => {
      const decide = vi.fn();
      const availability = vi.fn();
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
        {
          ...options,
          fetch: answerApi(({ path, query }) => {
            if (path.endsWith('/tools'))
              return {
                data: [{ id: 'codex', name: 'Codex', model: 'model-one' }],
              };
            if (path.endsWith('/availability')) {
              availability(query?.tool);
              return {
                data: { status: 'available', runnerName: 'Lima', reason: null },
              };
            }
            return new Response(null, { status: 404 });
          }),
        },
      );
      expect(
        await screen.findByText('model-one · Available (Lima)'),
      ).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Tool' })).toHaveTextContent(
        'Default tool (Codex)',
      );
      expect(availability).toHaveBeenCalledWith('codex');
      await userEvent.click(
        screen.getByRole('button', {
          name: start ? 'Start execution' : 'Assign only, do not start',
        }),
      );
      expect(decide).toHaveBeenCalledWith(start, {
        type: 'bot',
        id: 'b1',
        tool: 'codex',
        toolSource: 'default',
      });
    },
  );

  it('previews the kind’s unavailable default instead of the first tool', async () => {
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
      {
        ...options,
        fetch: answerApi(({ path, query }) => {
          if (path.endsWith('/tools'))
            return {
              data: tools.map((tool) => ({
                ...tool,
                isDefault: tool.id === 'other',
              })),
            };
          if (path.endsWith('/availability')) {
            expect(query?.tool).toBe('other');
            return {
              data: {
                status: 'unavailable',
                runnerName: null,
                reason: 'No online runner with Other tool',
              },
            };
          }
          return new Response(null, { status: 404 });
        }),
      },
    );
    expect(
      await screen.findByText('model-two · No online runner with Other tool'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Tool' })).toHaveTextContent(
      'Default tool (Other tool)',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Start execution' }),
    );
    expect(decide).toHaveBeenCalledWith(true, {
      type: 'bot',
      id: 'b1',
      tool: 'other',
      toolSource: 'default',
    });
  });

  it('restores the default preview after clearing an explicit choice in confirmation', async () => {
    const decide = vi.fn();
    await renderWithApp(
      <StartDialog
        request={{
          kind: 'bot',
          names: ['Worker'],
          executor: {
            type: 'bot',
            id: 'b1',
            tool: 'other',
            toolSource: 'explicit',
          },
        }}
        onDecide={decide}
        onCancel={() => undefined}
      />,
      options,
    );
    await screen.findByText('model-two · ⚠ No online runner with Other tool');
    await userEvent.click(screen.getByRole('combobox', { name: 'Tool' }));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Default tool (Codex)' }),
    );
    expect(
      await screen.findByText('model-one · Available (Lima)'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('model-two · ⚠ No online runner with Other tool'),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Assign only, do not start' }),
    );
    expect(decide).toHaveBeenCalledWith(false, {
      type: 'bot',
      id: 'b1',
      tool: 'codex',
      toolSource: 'default',
    });
  });

  it.each([
    {
      locale: 'en-US',
      label: 'Default tool (Codex)',
      available: 'Available (Lima)',
      tool: 'Tool',
    },
    {
      locale: 'zh-CN',
      label: '默认工具（Codex）',
      available: '可用（Lima）',
      tool: '工具',
    },
  ])(
    'shows the default model and availability in a $locale selector',
    async ({ locale, label, available, tool }) => {
      const changed = vi.fn();
      await renderWithApp(
        <PmExecutorSelect
          value={{ type: 'bot', id: 'b1' }}
          members={[]}
          others={[{ type: 'bot', id: 'b1', name: 'Worker' }]}
          onChange={changed}
        />,
        { ...options, locale },
      );
      expect(
        await screen.findByText(`model-one · ${available}`),
      ).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: tool })).toHaveTextContent(
        label,
      );
      expect(changed).not.toHaveBeenCalled();
    },
  );

  it('keeps confirmation usable without tool capability and skips availability reads', async () => {
    const decide = vi.fn();
    const availability = vi.fn();
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
      {
        ...options,
        fetch: answerApi(({ path }) => {
          if (path.endsWith('/tools')) return { data: [] };
          if (path.endsWith('/availability')) availability();
          return new Response(null, { status: 404 });
        }),
      },
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Start execution' }),
      ).toBeEnabled(),
    );
    expect(
      screen.queryByRole('combobox', { name: 'Tool' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Start execution' }),
    );
    expect(decide).toHaveBeenCalledWith(true, { type: 'bot', id: 'b1' });
    expect(availability).not.toHaveBeenCalled();
  });

  it('requires a choice when a kind has not resolved a multi-tool default', async () => {
    const availability = vi.fn();
    await renderWithApp(
      <StartDialog
        request={{
          kind: 'bot',
          names: ['Worker'],
          executor: { type: 'bot', id: 'b1' },
        }}
        onDecide={() => undefined}
        onCancel={() => undefined}
      />,
      {
        ...options,
        fetch: answerApi(({ path }) => {
          if (path.endsWith('/tools'))
            return {
              data: tools.map(({ isDefault: _default, ...tool }) => tool),
            };
          if (path.endsWith('/availability')) availability();
          return new Response(null, { status: 404 });
        }),
      },
    );
    expect(
      await screen.findByText(
        'Choose a tool to preview its model and availability',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start execution' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Assign only, do not start' }),
    ).toBeEnabled();
    expect(availability).not.toHaveBeenCalled();
  });

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

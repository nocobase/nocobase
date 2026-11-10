/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App, Modal } from 'antd';
import { FlowContext, FlowContextProvider } from '@nocobase/flow-engine';
import { MCPSettingsPage, type MCPRecord } from '../pages/MCPSettingsPage';

const mocks = vi.hoisted(() => ({ resource: vi.fn(), language: 'en-US' }));
vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const app = { apiClient: { resource: mocks.resource } };
  return { ...(await importOriginal<typeof import('@nocobase/client-v2')>()), useApp: () => app };
});
vi.mock('../locale', async () => {
  const en = (await import('../../locale/en-US.json')).default;
  const zh = (await import('../../locale/zh-CN.json')).default;
  const t = (key: string) => {
    const messages: Record<string, string> = mocks.language === 'zh-CN' ? zh : en;
    return messages[key] || key;
  };
  return { useT: () => t };
});

type BeforeClose = (payload?: { force?: boolean }) => Promise<boolean | void> | boolean | void;

const initialRecords = (): MCPRecord[] => [
  {
    name: 'legacy',
    transport: 'stdio',
    command: 'node',
    args: ['fixture.js'],
    env: { TOKEN: 'fixture-token' },
    enabled: false,
  },
  {
    name: 'managed',
    transport: 'http',
    url: 'http://127.0.0.1/managed',
    headers: { User: 'fixture-user' },
    fromFile: true,
    enabled: false,
  },
  {
    name: 'ordinary',
    title: 'Ordinary',
    transport: 'http',
    url: 'http://127.0.0.1/ordinary',
    headers: {},
    enabled: true,
  },
];

function renderSettings(records = initialRecords()) {
  const actions = {
    list: vi.fn().mockImplementation(async () => ({ data: { data: records } })),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    destroy: vi.fn().mockResolvedValue({}),
    rebuildClient: vi.fn().mockResolvedValue({}),
    testConnection: vi.fn().mockResolvedValue({ data: { data: { success: true, toolsCount: 0 } } }),
    listTools: vi.fn().mockResolvedValue({
      data: {
        data: { legacy: [{ name: 'getWeather', title: 'Get weather', serverName: 'legacy', permission: 'ASK' }] },
      },
    }),
    updateToolPermission: vi.fn().mockResolvedValue({}),
  };
  mocks.resource.mockReturnValue(actions);
  const context = new FlowContext();
  context.defineMethod('t', (key: string) => key);
  context.defineProperty('$env', {
    value: { TOKEN: 'fixture' },
    meta: { title: 'Environment', type: 'object', properties: { TOKEN: { title: 'Token', type: 'string' } } },
  });
  context.defineProperty('user', {
    value: { id: 1 },
    meta: { title: 'User', type: 'object', properties: { id: { title: 'ID', type: 'number' } } },
  });
  const view: {
    Header: React.FC<{ title: string }>;
    Footer: React.FC<React.PropsWithChildren>;
    close: ReturnType<typeof vi.fn>;
    beforeClose?: BeforeClose;
  } = {
    Header: ({ title }) => <h2>{title}</h2>,
    Footer: ({ children }) => <footer>{children}</footer>,
    close: vi.fn(),
  };
  function Host() {
    const [drawer, setDrawer] = useState<React.ReactNode>();
    context.defineProperty('view', { value: view });
    context.defineProperty('viewer', {
      value: { open: ({ content }: { content: React.ReactNode }) => setDrawer(content) },
    });
    view.close.mockImplementation(async (_result?: unknown, force?: boolean) => {
      if ((await view.beforeClose?.({ force })) === false) return false;
      setDrawer(undefined);
      return true;
    });
    return (
      <App>
        <FlowContextProvider context={context}>
          <MCPSettingsPage />
          {drawer ? (
            <section role="dialog" aria-label="MCP settings">
              {drawer}
            </section>
          ) : null}
        </FlowContextProvider>
      </App>
    );
  }
  const result = render(<Host />);
  return { ...result, actions, view };
}

const rowFor = (name: string) => {
  const row = screen.getByText(name, { selector: 'td' }).closest('tr');
  if (!row) throw new Error('Missing table row');
  return within(row);
};
const openEdit = async (name: string) => {
  await screen.findByText(name, { selector: 'td' });
  await act(async () => {
    fireEvent.click(rowFor(name).getByRole('button', { name: 'Edit' }));
  });
  return within(await screen.findByRole('dialog', { name: 'MCP settings' }));
};

afterEach(() => {
  cleanup();
  Modal.destroyAll();
  mocks.resource.mockReset();
  mocks.language = 'en-US';
});

describe('MCP settings real form interactions', () => {
  it('defaults new servers to HTTP and excludes stdio from editable choices', async () => {
    renderSettings();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add new/ }));
    });
    const dialog = within(screen.getByRole('dialog', { name: 'MCP settings' }));
    expect(dialog.getByText('HTTP (Streamable)')).toBeInTheDocument();
    await act(async () => {
      fireEvent.mouseDown(dialog.getByRole('combobox'));
    });
    expect(screen.queryByRole('option', { name: 'Stdio' })).not.toBeInTheDocument();
    expect(
      dialog.getByText('Stdio MCP servers can only be configured in storage/ai/mcp/servers.json.'),
    ).toBeInTheDocument();
  });

  it.each(['legacy', 'managed'])(
    'renders %s read-only, including real variable inputs and key-value buttons',
    async (name) => {
      const { actions } = renderSettings();
      const dialog = await openEdit(name);
      expect(dialog.getByLabelText('Title')).toBeDisabled();
      expect(dialog.getByLabelText('Description')).toBeDisabled();
      expect(dialog.getByRole('combobox')).toBeDisabled();
      expect(dialog.getByRole('checkbox')).toBeDisabled();
      expect(dialog.getByRole('button', { name: 'Submit' })).toBeDisabled();
      expect(
        dialog.getByRole('button', { name: name === 'legacy' ? /Add variable/ : /Add request header/ }),
      ).toBeDisabled();
      expect(dialog.getByRole('button', { name: 'Delete' })).toBeDisabled();
      dialog.getAllByRole('textbox', { name: 'Name' }).forEach((input) => expect(input).toBeDisabled());
      dialog.getAllByRole('button', { name: 'x', exact: true }).forEach((button) => expect(button).toBeDisabled());
      const root = screen.getByRole('dialog', { name: 'MCP settings' });
      const editors = root.querySelectorAll('[contenteditable]');
      expect(editors.length).toBeGreaterThan(0);
      editors.forEach((editor) => {
        expect(editor.getAttribute('contenteditable')).toBe('false');
        expect(editor.getAttribute('aria-readonly')).toBe('true');
      });
      await act(async () => {
        fireEvent.keyDown(dialog.getByLabelText('Title'), { key: 'Enter', code: 'Enter' });
      });
      const form = root.querySelector('form');
      if (!form) throw new Error('Missing form');
      await act(async () => {
        fireEvent.submit(form);
      });
      await waitFor(() => expect(actions.update).not.toHaveBeenCalled());
      expect(actions.testConnection).not.toHaveBeenCalled();
      expect(actions.create).not.toHaveBeenCalled();
    },
  );

  it.each(['legacy', 'managed'])(
    'allows Test and Cancel without a title or an unsaved warning for %s',
    async (name) => {
      const { actions, view } = renderSettings();
      const dialog = await openEdit(name);
      const flight = dialog.getByRole('button', { name: /Test flight/ });
      expect(flight).toBeEnabled();
      await act(async () => {
        fireEvent.click(flight);
      });
      await waitFor(() => expect(actions.testConnection).toHaveBeenCalledTimes(1));
      if (name === 'legacy') expect(actions.testConnection).toHaveBeenCalledWith({ filterByTk: 'legacy' });
      else
        expect(actions.testConnection).toHaveBeenCalledWith({
          values: expect.objectContaining({ url: 'http://127.0.0.1/managed' }),
        });
      await dialog.findByText('Connection Successful');
      await act(async () => {
        fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
      });
      await waitFor(() => expect(view.close).toHaveBeenCalled());
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'MCP settings' })).not.toBeInTheDocument());
    },
  );

  it('keeps protected enabled switches independent from the disabled editor', async () => {
    const { actions } = renderSettings();
    await openEdit('legacy');
    const toggle = rowFor('legacy').getByRole('switch');
    expect(toggle).toBeEnabled();
    await act(async () => {
      fireEvent.click(toggle);
    });
    await waitFor(() =>
      expect(actions.update).toHaveBeenCalledWith({ filterByTk: 'legacy', values: { enabled: true } }),
    );
    await waitFor(() => expect(actions.rebuildClient).toHaveBeenCalledTimes(1));
  });

  it('prevents single and mixed selection deletion and drops selections that become managed after refresh', async () => {
    const records = initialRecords();
    const { actions } = renderSettings(records);
    await screen.findByText('ordinary', { selector: 'td' });
    expect(rowFor('legacy').getByRole('checkbox')).toBeDisabled();
    expect(rowFor('managed').getByRole('checkbox')).toBeDisabled();
    expect(rowFor('legacy').getByRole('button', { name: 'Delete: legacy' })).toBeDisabled();
    expect(rowFor('managed').getByRole('button', { name: 'Delete: managed' })).toBeDisabled();
    await act(async () => {
      fireEvent.click(rowFor('ordinary').getByRole('checkbox'));
    });
    const bulkDelete = screen.getByRole('button', { name: /Delete$/ });
    expect(bulkDelete).toBeEnabled();
    records[2] = { ...records[2], fromFile: true };
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    });
    await waitFor(() => expect(rowFor('ordinary').getByRole('checkbox')).toBeDisabled());
    expect(bulkDelete).toBeDisabled();
    expect(actions.destroy).not.toHaveBeenCalled();
  });

  it('preserves ordinary remote testing, saving and rebuilding', async () => {
    const { actions, view } = renderSettings();
    const dialog = await openEdit('ordinary');
    await act(async () => {
      fireEvent.change(dialog.getByLabelText('Title'), { target: { value: 'Updated ordinary' } });
    });
    await act(async () => {
      fireEvent.click(dialog.getByRole('button', { name: 'Submit' }));
    });
    await waitFor(() =>
      expect(actions.update).toHaveBeenCalledWith({
        filterByTk: 'ordinary',
        values: expect.objectContaining({ title: 'Updated ordinary', transport: 'http' }),
      }),
    );
    expect(actions.testConnection).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(actions.rebuildClient).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(view.close).toHaveBeenCalledWith(undefined, true));
  });

  it('retains the current-user variable picker and failed-test save confirmation', async () => {
    const records = initialRecords();
    records[2].useUserContext = true;
    const { actions } = renderSettings(records);
    actions.testConnection.mockResolvedValue({ data: { data: { success: false } } });
    const dialog = await openEdit('ordinary');
    expect(dialog.getByRole('checkbox')).toBeChecked();
    await act(async () => {
      fireEvent.click(dialog.getByRole('button', { name: /Add request header/ }));
    });
    expect(dialog.getAllByRole('textbox', { name: 'Name' })).toHaveLength(2);
    await act(async () => {
      fireEvent.click(dialog.getAllByRole('button', { name: 'x', exact: true })[0]);
    });
    await screen.findByText('NocoBase request');
    expect(screen.getByText('User', { selector: '.ant-cascader-menu-item-content' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(dialog.getAllByRole('button', { name: 'x', exact: true })[0]);
    });
    await act(async () => {
      fireEvent.click(dialog.getByRole('button', { name: 'Submit' }));
    });
    await screen.findByText('Connection test failed');
    expect(actions.update).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save anyway' }));
    });
    await waitFor(() => expect(actions.update).toHaveBeenCalledTimes(1));
  });

  it('still asks before closing an unsaved ordinary form', async () => {
    const { actions } = renderSettings();
    const dialog = await openEdit('ordinary');
    await act(async () => {
      fireEvent.change(dialog.getByLabelText('Title'), { target: { value: 'Unsaved edit' } });
    });
    await act(async () => {
      fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    });
    await screen.findByText('Unsaved changes');
    expect(screen.getByRole('dialog', { name: 'MCP settings' })).toBeInTheDocument();
    expect(actions.update).not.toHaveBeenCalled();
  });

  it('keeps tool permissions editable for protected server tools', async () => {
    const { actions } = renderSettings();
    await screen.findByText('legacy', { selector: 'td' });
    await act(async () => {
      fireEvent.click(rowFor('legacy').getByRole('button', { name: 'View' }));
    });
    await screen.findByText('Get weather');
    await act(async () => {
      fireEvent.click(screen.getByText('Allow'));
    });
    await waitFor(() =>
      expect(actions.updateToolPermission).toHaveBeenCalledWith({
        values: { toolName: 'getWeather', permission: 'ALLOW' },
      }),
    );
  });

  it('renders the protected-state explanation and disabled submission in Chinese', async () => {
    mocks.language = 'zh-CN';
    renderSettings();
    await screen.findByText('managed', { selector: 'td' });
    await act(async () => {
      fireEvent.click(rowFor('managed').getByRole('button', { name: '编辑' }));
    });
    const dialog = within(screen.getByRole('dialog', { name: 'MCP settings' }));
    expect(dialog.getByText('此 MCP 服务由部署配置管理，仅可切换启用状态。')).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: /提\s*交/ })).toBeDisabled();
  });
});

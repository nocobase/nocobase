// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import MCPPage from '../client/pages/mcp-page.js';
import ToolsPage from '../client/pages/mcp-services/tools.js';
import type { MCPRecord, MCPToolEntry } from '../client/mcp-service.js';
import { useCanManageAISettings } from '../client/settings-permissions.js';

const ai = vi.hoisted(() => ({
  listMCPServers: vi.fn(),
  listMCPTools: vi.fn(),
  updateMCPServerEnabled: vi.fn(),
  updateMCPToolPermission: vi.fn(),
}));
vi.mock('../client/ai-employee-client.js', () => ({
  useAIEmployeeClient: () => ai,
}));
const parent = '/settings/ai/mcp-services';
const child = `${parent}/server-one/tools`;
const server: MCPRecord = {
  name: 'server-one',
  title: 'First server',
  transport: 'http',
  url: 'https://example.test/mcp',
  enabled: true,
  args: [],
  env: {},
  headers: {},
};
const tool: MCPToolEntry = {
  name: 'first-tool',
  serverName: server.name,
  title: 'First tool',
  description: 'Tool description',
  permission: 'ASK',
};

beforeEach(() => {
  vi.resetAllMocks();
  ai.listMCPServers.mockResolvedValue([structuredClone(server)]);
  ai.listMCPTools.mockResolvedValue({ [server.name]: [structuredClone(tool)] });
  ai.updateMCPToolPermission.mockResolvedValue(undefined);
});

async function renderRoutes(initialEntries: string[] = [child]) {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace('@nocobase/app-plugin-ai-employee', locales);
  await runtime.init('en-US');
  const router = createMemoryRouter(
    [
      {
        path: parent,
        element: <MCPPage />,
        children: [{ path: ':serverName/tools', element: <ToolsPage /> }],
      },
    ],
    { initialEntries },
  );
  const result = render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  return { ...result, router };
}

it('waits on direct drawer URLs and closes to the parent preserving query parameters', async () => {
  let resolve!: (value: MCPRecord[]) => void;
  ai.listMCPServers.mockReturnValue(
    new Promise<MCPRecord[]>((done) => {
      resolve = done;
    }),
  );
  const { router, container } = await renderRoutes([`${child}?filter=http`]);
  const drawer = await screen.findByRole('dialog');
  expect(within(drawer).getByRole('status')).toHaveTextContent('Loading…');
  expect(within(drawer).queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => resolve([server]));
  expect(await screen.findByText('First tool')).toBeVisible();
  expect(container).toHaveTextContent('First server');
  fireEvent.keyDown(permissionMenu(), { key: 'Escape' });
  await waitFor(() => expect(router.state.location.pathname).toBe(parent));
  expect(router.state.location.search).toBe('?filter=http');
  expect(ai.listMCPServers).toHaveBeenCalledTimes(1);
});

it.each(['missing', 'failure'])(
  'shows direct child %s instead of an empty tools panel',
  async (kind) => {
    if (kind === 'missing') ai.listMCPServers.mockResolvedValue([]);
    else ai.listMCPServers.mockRejectedValue(new Error('MCP request failed'));
    await renderRoutes();
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByRole('alert')).toHaveTextContent(
      kind === 'missing' ? 'MCP server not found.' : 'MCP request failed',
    );
    expect(within(drawer).queryByText('First tool')).not.toBeInTheDocument();
  },
);

it('navigates from the list and restores trigger focus after Escape', async () => {
  const { router } = await renderRoutes([parent]);
  const trigger = await screen.findByRole('button', { name: 'View' });
  trigger.focus();
  fireEvent.click(trigger);
  const drawer = await screen.findByRole('dialog');
  await waitFor(() =>
    expect(drawer).toContainElement(document.activeElement as HTMLElement),
  );
  expect(router.state.location.pathname).toBe(child);
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(ai.listMCPServers).toHaveBeenCalledTimes(1);
});

it('supports back and forward without remounting the server list', async () => {
  const { router } = await renderRoutes([parent, child]);
  await screen.findByText('First tool');
  await act(async () => {
    await router.navigate(-1);
  });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await act(async () => {
    await router.navigate(1);
  });
  expect(await screen.findByText('First tool')).toBeVisible();
  expect(ai.listMCPServers).toHaveBeenCalledTimes(1);
});

// The same permission menu serves employee tools and MCP tools.
function permissionMenu(): HTMLElement {
  return screen.getByRole('button', { name: 'Permission: First tool' });
}

async function choosePermission(name: 'Ask' | 'Allow'): Promise<void> {
  fireEvent.click(permissionMenu());
  fireEvent.click(await screen.findByRole('menuitemradio', { name }));
  // Let the menu finish closing, so a following choice opens it again instead of toggling it shut.
  await waitFor(() =>
    expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
  );
}

it('retains the old permission on request failure and updates selection only after retry succeeds', async () => {
  ai.updateMCPToolPermission.mockRejectedValueOnce(
    new Error('Permission request failed'),
  );
  await renderRoutes();
  await screen.findByText('First tool');
  expect(permissionMenu()).toHaveTextContent('Ask');
  await choosePermission('Allow');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Permission request failed',
  );
  expect(permissionMenu()).toHaveTextContent('Ask');
  await choosePermission('Allow');
  await waitFor(() => expect(permissionMenu()).toHaveTextContent('Allow'));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(ai.updateMCPToolPermission).toHaveBeenLastCalledWith(
    tool.serverName,
    tool.name,
    'ALLOW',
  );
});

it('locks a pending permission mutation and preserves its result when reopening the drawer', async () => {
  let resolve!: () => void;
  ai.updateMCPToolPermission.mockReturnValue(
    new Promise<void>((done) => {
      resolve = done;
    }),
  );
  await renderRoutes();
  await screen.findByText('First tool');
  await choosePermission('Allow');
  expect(permissionMenu()).toHaveTextContent('Ask');
  expect(permissionMenu()).toBeDisabled();
  fireEvent.click(permissionMenu());
  expect(ai.updateMCPToolPermission).toHaveBeenCalledTimes(1);
  await act(async () => resolve());
  expect(permissionMenu()).toHaveTextContent('Allow');
  expect(permissionMenu()).not.toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(await screen.findByRole('button', { name: 'View' }));
  await screen.findByText('First tool');
  expect(permissionMenu()).toHaveTextContent('Allow');
});

it('shows the servers and their tools read-only without manage', async () => {
  vi.mocked(useCanManageAISettings).mockReturnValue(false);
  await renderRoutes([parent]);
  const toggle = await screen.findByRole('switch', {
    name: 'Enabled: server-one',
  });
  expect(useCanManageAISettings).toHaveBeenCalledWith('mcpServers');
  expect(toggle).toHaveAttribute('data-disabled');
  fireEvent.click(toggle);
  expect(ai.updateMCPServerEnabled).not.toHaveBeenCalled();

  // Viewing a server's tools is still allowed; changing their permission is not.
  fireEvent.click(screen.getByRole('button', { name: 'View' }));
  expect(await screen.findByText('First tool')).toBeVisible();
  expect(permissionMenu()).toBeDisabled();
  fireEvent.click(permissionMenu());
  expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument();
  expect(ai.updateMCPToolPermission).not.toHaveBeenCalled();
});

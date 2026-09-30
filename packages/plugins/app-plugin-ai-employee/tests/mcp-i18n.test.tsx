// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import ToolsPage from '../client/pages/mcp-services/tools.js';
import locales from '../client/locales/index.js';
import MCPServiceSettingsPage from '../client/pages/mcp-service-settings-page.js';

vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => api,
}));
const api = {};
vi.mock('../client/mcp-service.js', () => ({
  listMCPServers: async () => [],
  listMCPTools: async () => ({}),
  updateMCPServerEnabled: vi.fn(),
  updateMCPToolPermission: vi.fn(),
}));

it('translates the MCP configuration notice and updates it when language changes', async () => {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace('@nocobase/app-plugin-ai-employee', locales);
  await runtime.init('zh-CN');
  const router = createMemoryRouter(
    [
      {
        path: '/settings/ai/mcp-services',
        element: <MCPServiceSettingsPage />,
        children: [{ path: ':serverName/tools', element: <ToolsPage /> }],
      },
    ],
    { initialEntries: ['/settings/ai/mcp-services'] },
  );
  render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  expect(
    await screen.findByText(
      '管理 MCP 服务状态和工具权限。服务连接在应用部署时配置。',
    ),
  ).toBeVisible();
  expect(screen.getAllByText(/服务连接在应用部署时配置/)).toHaveLength(1);
  await act(() => runtime.changeLanguage('en-US'));
  expect(
    screen.getByText(
      'Manage MCP service status and tool permissions. Connections are configured during deployment.',
    ),
  ).toBeVisible();
  expect(
    screen.getAllByText(/Connections are configured during deployment/),
  ).toHaveLength(1);
});

it('guides MCP configuration through a coding agent when no server is configured', async () => {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace('@nocobase/app-plugin-ai-employee', locales);
  await runtime.init('en-US');
  const router = createMemoryRouter(
    [
      {
        path: '/settings/ai/mcp-services',
        element: <MCPServiceSettingsPage />,
      },
    ],
    { initialEntries: ['/settings/ai/mcp-services'] },
  );
  render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  expect(
    await screen.findByRole('heading', {
      name: 'No MCP services configured yet',
    }),
  ).toBeVisible();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  const steps = within(screen.getByRole('list')).getAllByRole('listitem');
  expect(steps).toHaveLength(3);
  expect(steps[0]).toHaveTextContent('the one that contains config.yml');
  expect(steps[2]).toHaveTextContent('set their permissions here');
  const prompt = screen.getByLabelText('Prompt');
  expect(prompt).toHaveTextContent('Configure an MCP service');
  // Credentials go where the settings page masks them, never into url or args.
  expect(prompt).toHaveTextContent(
    'headers for http and sse, or in env for stdio',
  );
  expect(prompt).not.toHaveTextContent('ai-employee models');
  expect(screen.getByRole('button', { name: 'Copy prompt' })).toBeVisible();
  await act(() => runtime.changeLanguage('zh-CN'));
  expect(
    screen.getByRole('heading', { name: '还没有配置 MCP 服务' }),
  ).toBeVisible();
  expect(screen.getByLabelText('提示词')).toHaveTextContent(
    '请为这个 NocoBase 应用配置一个 MCP 服务',
  );
});

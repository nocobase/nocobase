// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '@nocobase/i18n/client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import LLMServiceSettingsPage from '../client/pages/llm-service-settings-page.js';
import MCPServiceSettingsPage from '../client/pages/mcp-service-settings-page.js';
import { updateLLMServiceEnabled } from '../client/llm-service-service.js';
import { updateMCPServerEnabled } from '../client/mcp-service.js';

const api = {};
vi.mock('@nocobase/app-client', () => ({ useApiClient: () => api }));
vi.mock('../client/api-client.js', () => ({ apiClient: {} }));
vi.mock('../client/llm-service-service.js', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../client/llm-service-service.js')
  >()),
  listLLMServices: async () => [
    { name: 'test-llm', title: 'Test LLM', provider: 'openai', enabled: true },
  ],
  listLLMProviders: async () => [{ name: 'openai', title: 'OpenAI' }],
  updateLLMServiceEnabled: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../client/mcp-service.js', () => ({
  listMCPServers: async () => [
    { name: 'test-mcp', title: 'Test MCP', transport: 'stdio', enabled: true },
  ],
  listMCPTools: async () => ({}),
  updateMCPServerEnabled: vi.fn().mockResolvedValue(undefined),
  updateMCPToolPermission: vi.fn(),
}));

describe('service settings table layout', () => {
  it.each([
    [LLMServiceSettingsPage, 'LLM services', 'test-llm'],
    [MCPServiceSettingsPage, 'MCP services', 'test-mcp'],
  ] as const)(
    'uses the settings gutters and standard table for %s',
    async (Page, title, name) => {
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
      const { container } = render(
        <I18nProvider runtime={runtime}>
          <MemoryRouter>
            <Page />
          </MemoryRouter>
        </I18nProvider>,
      );
      expect(await screen.findByText(name)).toBeVisible();
      expect(
        screen.getByRole('heading', { name: title, level: 1 }),
      ).toBeVisible();
      expect(screen.getAllByRole('heading')).toHaveLength(1);
      expect(
        screen.getAllByText(/Connections are configured during deployment/),
      ).toHaveLength(1);
      expect(
        screen.getByText(/Connections are configured during deployment/)
          .parentElement,
      ).toContainElement(
        screen.getByRole('heading', { name: title, level: 1 }),
      );
      const page = container.querySelector('section');
      expect(page).toHaveClass('p-6', 'md:p-8');
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('data-slot', 'table');
      expect(table.parentElement).toHaveClass('overflow-x-auto');
      const frame = table.parentElement?.parentElement;
      expect(frame).toHaveClass('rounded-xl', 'border', 'bg-card');
      expect(frame?.parentElement).toHaveClass(
        'flex',
        'min-w-0',
        'flex-col',
        'gap-4',
      );
      expect(frame?.parentElement).not.toHaveClass('px-3', 'sm:px-4');
      for (const header of screen.getAllByRole('columnheader')) {
        expect(header).toHaveAttribute('data-slot', 'table-head');
        expect(header).not.toHaveClass('uppercase', 'px-5');
      }
      fireEvent.click(screen.getByRole('switch'));
      await waitFor(() => {
        if (name === 'test-llm') {
          expect(updateLLMServiceEnabled).toHaveBeenCalledWith(
            api,
            name,
            false,
          );
        } else {
          expect(updateMCPServerEnabled).toHaveBeenCalledWith(api, name, false);
        }
      });
    },
  );
});

import {
  ClientApplicationContext,
  NavigationGuardProvider,
} from '@nocobase/app-client';
import projects from '@nocobase/app-plugin-projects/client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import RoleDetailPage from '../../client/pages/config/role-detail.js';
import type { Role } from '../../shared/access.js';
import { createRoleTestApp } from '../helpers/role-authorization.js';

const { api, success } = vi.hoisted(() => ({
  api: { roles: vi.fn(), catalog: vi.fn(), createRole: vi.fn() },
  success: vi.fn(),
}));
vi.mock('../../client/access/api.js', () => ({
  studioKeys: { roles: ['roles'], catalog: ['catalog'] },
  useStudioApi: () => api,
}));
vi.mock('../../client/access/notify.js', () => ({
  useNotify: () => ({ success, error: vi.fn() }),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  usePageBreadcrumb: vi.fn(),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({}),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/studio', resources: enUS },
  namespaces: {
    '@nocobase/app-plugin-projects': projects({ routes: false }).locales!,
  },
});

describe('duplicating from the role detail page', () => {
  it('sends a legal title and the current permission draft, then opens the new identity', async () => {
    const source: Role = {
      key: 'source',
      title: 'x'.repeat(100),
      builtIn: false,
      editable: true,
      pages: ['pm-issues'],
      settings: { 'pm.labels/read': true },
      abilities: { 'pm.issues/view': 'all' },
      holderIds: ['synthetic-member'],
      holderCount: 1,
    };
    api.roles.mockResolvedValue([source]);
    api.catalog.mockResolvedValue({ businesses: [], settings: [] });
    api.createRole.mockResolvedValue({
      ...source,
      key: 'copy',
      title: 'x'.repeat(93) + ' (copy)',
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const app = createRoleTestApp();
    render(
      <TestI18nProvider runtime={runtime}>
        <ClientApplicationContext.Provider value={app}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/config/roles/source']}>
              <NavigationGuardProvider>
                <Routes>
                  <Route
                    path='/config/roles/:roleKey'
                    element={<RoleDetailPage />}
                  />
                  <Route
                    path='/config/roles/copy'
                    element={<p>Copy detail</p>}
                  />
                </Routes>
              </NavigationGuardProvider>
            </MemoryRouter>
          </QueryClientProvider>
        </ClientApplicationContext.Provider>
      </TestI18nProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Duplicate as new role' }),
      ).toBeEnabled(),
    );
    fireEvent.click(
      await screen.findByRole('switch', { name: 'Projects', exact: true }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Duplicate as new role' }),
    );
    const confirmation = await screen.findByRole('alertdialog', {
      name: 'Discard unsaved changes?',
    });
    expect(confirmation).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Discard', exact: true }),
    );
    expect(await screen.findByText('Copy detail')).toBeVisible();
    expect(api.createRole).toHaveBeenCalledExactlyOnceWith({
      title: 'x'.repeat(93) + ' (copy)',
      pages: ['pm-issues', 'pm-projects'],
      settings: source.settings,
      abilities: source.abilities,
    });
    expect(source.pages).toEqual(['pm-issues']);
    expect(success).toHaveBeenCalledOnce();
    queryClient.clear();
  });
});

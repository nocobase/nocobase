import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import RoleDetailPage from '../../client/pages/config/role-detail.js';
import type { Role } from '../../shared/access.js';

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
  canUseSetting: () => true,
}));
vi.mock('@nocobase/i18n/client', async (original) => ({
  ...(await original<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key === 'roles.copyOf' ? `${String(options?.name)} (copy)` : key,
  }),
}));

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
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/config/roles/source']}>
          <Routes>
            <Route path='/config/roles/:roleKey' element={<RoleDetailPage />} />
            <Route path='/config/roles/copy' element={<p>Copy detail</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(
      await screen.findByRole('switch', { name: 'navigation.projects' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'roles.duplicate' }));
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

import { NavigationGuardProvider } from '@nocobase/app-client';
import projects from '@nocobase/app-plugin-projects/client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.ts';
import RoleDetailPage from '../../client/pages/config/role-detail.tsx';
import type { Role } from '../../shared/access.ts';

const state = vi.hoisted(() => ({
  update: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));
const role: Role = {
  key: 'custom',
  title: 'Original role',
  builtIn: false,
  editable: true,
  pages: [],
  settings: {},
  abilities: {},
  holderIds: [],
  holderCount: 0,
};
const api = {
  roles: () => Promise.resolve([role]),
  catalog: () => Promise.resolve({ businesses: [], settings: [] }),
  updateRole: state.update,
};
vi.mock('../../client/access/api.js', () => ({
  studioKeys: { roles: ['roles'], catalog: ['catalog'] },
  useStudioApi: () => api,
}));
vi.mock('../../client/access/notify.js', () => ({
  useNotify: () => ({ success: state.success, error: state.error }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({ userId: 'owner' }),
  canUseSetting: () => true,
}));

const plugin = projects({ routes: false });
const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/studio', resources: enUS },
  namespaces: { '@nocobase/app-plugin-projects': plugin.locales! },
});

async function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/config/roles/custom']}>
          <NavigationGuardProvider>
            <Link to='/config/roles'>Leave role</Link>
            <Routes>
              <Route
                path='/config/roles/:roleKey'
                element={<RoleDetailPage />}
              />
              <Route
                path='/config/roles'
                element={<p>Role list destination</p>}
              />
            </Routes>
          </NavigationGuardProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  return screen.findByRole('textbox', { name: 'Name', exact: true });
}

beforeEach(() => {
  state.update.mockReset();
  state.error.mockReset();
  state.success.mockReset();
});

it('asks before leaving a changed name, preserves a cancellation, and leaves after explicit discard', async () => {
  const name = await setup();
  fireEvent.change(name, { target: { value: 'Unsaved role' } });
  fireEvent.click(screen.getByText('Leave role'));
  await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
  fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  );
  expect(name).toHaveValue('Unsaved role');
  fireEvent.click(screen.getByText('Leave role'));
  await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
  fireEvent.click(screen.getByRole('button', { name: 'Discard', exact: true }));
  expect(await screen.findByText('Role list destination')).toBeVisible();
});

it('clears the saved baseline immediately without waiting for the roles refetch', async () => {
  state.update.mockResolvedValue({ ...role, title: 'Saved role' });
  const name = await setup();
  fireEvent.change(name, { target: { value: 'Saved role ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(name).toHaveValue('Saved role'));
  fireEvent.click(screen.getByText('Leave role'));
  expect(await screen.findByText('Role list destination')).toBeVisible();
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

it('retains a failed save and protects leaving', async () => {
  state.update.mockRejectedValue(new Error('Simulated failure'));
  const name = await setup();
  fireEvent.change(name, { target: { value: 'Failed save role' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(state.error).toHaveBeenCalledOnce());
  expect(name).toHaveValue('Failed save role');
  fireEvent.click(screen.getByText('Leave role'));
  expect(
    await screen.findByRole('alertdialog', {
      name: 'Discard unsaved changes?',
    }),
  ).toBeVisible();
});

it('keeps edits made during a successful request dirty', async () => {
  let finish: (updated: Role) => void = () => undefined;
  state.update.mockImplementation(
    () =>
      new Promise<Role>((resolve) => {
        finish = resolve;
      }),
  );
  const name = await setup();
  fireEvent.change(name, { target: { value: 'Submitted role' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(state.update).toHaveBeenCalledOnce());
  fireEvent.change(name, { target: { value: 'Next unsaved edit' } });
  await act(async () => finish({ ...role, title: 'Submitted role' }));
  expect(name).toHaveValue('Next unsaved edit');
  fireEvent.click(screen.getByText('Leave role'));
  expect(
    await screen.findByRole('alertdialog', {
      name: 'Discard unsaved changes?',
    }),
  ).toBeVisible();
});

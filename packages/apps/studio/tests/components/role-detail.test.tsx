import {
  ClientApplicationContext,
  NavigationGuardProvider,
} from '@nocobase/app-client';
import projects from '@nocobase/app-plugin-projects/client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import RoleDetailPage from '../../client/pages/config/role-detail.js';
import type { Role, SaveRoleRequest } from '../../shared/access.js';
import { createRoleTestApp } from '../helpers/role-authorization.js';

const state = vi.hoisted(() => ({
  update: vi.fn(),
  roles: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  usePageBreadcrumb: () => undefined,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({ userId: 'root' }),
}));
vi.mock('../../client/access/api.js', () => ({
  studioKeys: { roles: ['roles'], catalog: ['catalog'] },
  useStudioApi: () => ({
    roles: state.roles,
    catalog: async () => ({ businesses: [], settings: [] }),
    updateRole: state.update,
  }),
}));
vi.mock('../../client/access/notify.js', () => ({
  useNotify: () => ({ success: state.success, error: state.error }),
}));

const original: Role = {
  key: 'custom',
  title: 'Original',
  builtIn: false,
  editable: true,
  pages: [],
  settings: {},
  abilities: {},
  holderIds: [],
  holderCount: 0,
};
const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/studio', resources: enUS },
  namespaces: {
    '@nocobase/app-plugin-projects': projects({ routes: false }).locales!,
  },
});

beforeEach(() => {
  state.roles.mockReset().mockResolvedValue([original]);
  state.update.mockReset();
  state.success.mockReset();
  state.error.mockReset();
});

async function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const app = createRoleTestApp();
  render(
    <TestI18nProvider runtime={runtime}>
      <ClientApplicationContext.Provider value={app}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/config/roles/custom']}>
            <NavigationGuardProvider>
              <Routes>
                <Route
                  path='/config/roles/:roleKey'
                  element={<RoleDetailPage />}
                />
              </Routes>
            </NavigationGuardProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </ClientApplicationContext.Provider>
    </TestI18nProvider>,
  );
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeEnabled(),
  );
  return client;
}
function name(value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
    target: { value },
  });
}
function save() {
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
}

it('uses the normalized response immediately, even before refresh finishes', async () => {
  await mount();
  state.roles.mockImplementation(() => new Promise(() => {}));
  state.update.mockResolvedValue({ ...original, title: 'Normalized' });
  name('  Normalized  ');
  save();
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Normalized',
    ),
  );
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Discard changes' }),
  ).toBeDisabled();
  expect(state.update).toHaveBeenCalledWith(
    'custom',
    expect.objectContaining({ title: '  Normalized  ' }),
  );
  name('Next edit');
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeEnabled();
});

it('preserves a post-submit edit back to the original value through the response and refresh', async () => {
  await mount();
  let finish!: (role: Role) => void;
  state.update.mockImplementation(
    (_key: string, _input: SaveRoleRequest) =>
      new Promise<Role>((resolve) => {
        finish = resolve;
      }),
  );
  name('Submitted');
  save();
  await waitFor(() => expect(state.update).toHaveBeenCalled());
  name('Original');
  const updated = { ...original, title: 'Submitted' };
  state.roles.mockResolvedValue([updated]);
  await act(async () => {
    finish(updated);
  });
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save', exact: true }),
    ).toBeEnabled(),
  );
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Original');
  fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
    'Submitted',
  );
});

it('retains failed input and reports the error', async () => {
  await mount();
  state.update.mockRejectedValue(new Error('Failed'));
  name('  Unsubmitted  ');
  save();
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
    '  Unsubmitted  ',
  );
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeEnabled();
});

it.each(['title', 'permission'] as const)(
  'preserves reverted %s edits when GET precedes PATCH, then supports saving and discarding',
  async (field) => {
    await mount();
    let finish!: (role: Role) => void;
    state.update.mockImplementation(
      () =>
        new Promise<Role>((resolve) => {
          finish = resolve;
        }),
    );
    const permission = () =>
      screen.getByRole('switch', { name: 'My issues', exact: true });
    name('Submitted');
    if (field === 'permission') fireEvent.click(permission());
    save();
    await waitFor(() => expect(state.update).toHaveBeenCalled());
    if (field === 'title') name('Original');
    else fireEvent.click(permission());
    const updated: Role = {
      ...original,
      title: 'Submitted',
      pages: field === 'permission' ? ['pm-my-issues'] : [],
    };
    state.roles.mockResolvedValue([updated]);
    await act(async () => {
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
    });
    await waitFor(() =>
      expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0),
    );
    if (field === 'title')
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Original',
      );
    else expect(permission()).not.toBeChecked();
    await act(async () => {
      finish(updated);
    });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save', exact: true }),
      ).toBeEnabled(),
    );
    if (field === 'title')
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Original',
      );
    else expect(permission()).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Submitted',
    );
    if (field === 'permission') expect(permission()).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    if (field === 'title') name('Original');
    else fireEvent.click(permission());
    const next: Role = {
      ...updated,
      title: field === 'title' ? 'Original' : 'Submitted',
      pages: [],
    };
    state.roles.mockResolvedValue([next]);
    state.update.mockResolvedValue(next);
    save();
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(2));
    expect(state.update).toHaveBeenLastCalledWith(
      'custom',
      expect.objectContaining({ title: next.title, pages: [] }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save', exact: true }),
      ).toBeDisabled(),
    );
  },
);

it('refreshes untouched values normally when no save is pending', async () => {
  const client = await mount();
  await act(async () => {
    client.setQueryData(
      ['roles'],
      [{ ...original, title: 'Refreshed', pages: ['pm-my-issues'] }],
    );
  });
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Refreshed',
    ),
  );
  expect(
    screen.getByRole('switch', { name: 'My issues', exact: true }),
  ).toBeChecked();
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
});

import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  canUseSetting: () => true,
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
  application: { namespace: 'app', resources: enUS },
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
  render(
    <TestI18nProvider runtime={runtime}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/config/roles/custom']}>
          <Routes>
            <Route path='/config/roles/:roleKey' element={<RoleDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  await screen.findByRole('textbox', { name: 'Name' });
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

import { ApiClientError, type ToastOptions } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
  useHref,
  useLocation,
} from 'react-router';
import { useNotify } from '../../client/hooks/use-notify.js';
import enUS from '../../client/locales/en-US.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
const mocks = vi.hoisted(() => ({
  show: vi.fn<(options: ToastOptions) => string>(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useToaster: () => ({ show: mocks.show }),
}));
afterEach(() => {
  cleanup();
  mocks.show.mockReset();
});
function failure() {
  return new ApiClientError('Missing model', {
    status: 400,
    reason: 'PROJECT_MANAGER_NOT_STARTED',
    method: 'POST',
    url: '/api/start',
    payload: {
      error: {
        metadata: {
          reason: 'managerNotConfigured',
          suggestions: [{ href: '/agents/project-manager' }],
        },
      },
    },
  });
}
function Probe() {
  const notify = useNotify();
  return (
    <>
      <button onClick={() => notify.error(failure())}>Report</button>
      <button onClick={() => notify.success('Saved')}>Save</button>
    </>
  );
}
function Location() {
  const location = useLocation();
  const href = useHref(location.pathname);
  return <output>{href}</output>;
}
async function content() {
  const runtime = await createTestI18nRuntime({
    namespaces: { [ACCESS_NAMESPACE]: enUS },
    // Setup error keys belong to the host; this fixture exercises their server-text fallback.
    strict: false,
    locale: 'en-US',
  });
  return (
    <TestI18nProvider runtime={runtime} namespace={ACCESS_NAMESPACE}>
      <Probe />
    </TestI18nProvider>
  );
}
it('shows ordinary and setup notifications without a router and omits the configuration action', async () => {
  render(await content());
  fireEvent.click(screen.getByRole('button', { name: 'Report' }));
  expect(mocks.show).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'error', title: 'Missing model' }),
  );
  expect(mocks.show.mock.lastCall?.[0].action).toBeUndefined();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(mocks.show).toHaveBeenLastCalledWith({
    type: 'success',
    title: 'Saved',
  });
});
it.each(['declarative', 'data'] as const)(
  'keeps a single deployment prefix with the %s router',
  async (kind) => {
    const element = (
      <>
        {await content()}
        <Location />
      </>
    );
    if (kind === 'declarative')
      render(
        <MemoryRouter basename='/mount' initialEntries={['/mount/issues/one']}>
          {element}
        </MemoryRouter>,
      );
    else {
      const router = createMemoryRouter([{ path: '*', element }], {
        basename: '/mount',
        initialEntries: ['/mount/issues/one'],
      });
      render(<RouterProvider router={router} />);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    const action = mocks.show.mock.lastCall?.[0].action;
    expect(action).toBeDefined();
    act(() => action!.onClick());
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        '/mount/agents/project-manager',
      ),
    );
  },
);

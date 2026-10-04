import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render } from './render.js';
import { useHostToaster } from './host-toaster.js';

import type {
  AppOverview,
  ListResponse,
  PageMeta,
  AppSummary,
  ReleaseRecord,
} from '../client/pages/hub/types.js';

const mocks = vi.hoisted(() => ({
  logMounted: vi.fn(),
  authorizationClientToken: Symbol('authorization-client'),
  client: {
    request: vi.fn(),
  },
  authorization: {
    can: vi.fn(),
    invalidate: vi.fn(),
    onInvalidated: vi.fn(() => () => undefined),
  },
}));

vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class ApiClientError extends Error {
    readonly status: number;
    readonly payload: unknown;
    readonly reason?: string;
    readonly domain?: string;
    constructor(
      message: string,
      options: {
        status: number;
        payload?: unknown;
        reason?: string;
        domain?: string;
      },
    ) {
      super(message);
      this.status = options.status;
      this.payload = options.payload;
      this.reason = options.reason;
      this.domain = options.domain;
    }
  },
  resolveAppUrl: (value: string) => value,
  useApiClient: () => mocks.client,
  useService: (token: unknown) => {
    expect(token).toBe(mocks.authorizationClientToken);
    return mocks.authorization;
  },
  useToaster: () => useHostToaster(),
}));

vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  authorizationClientToken: mocks.authorizationClientToken,
}));

import { Releases } from '../client/pages/hub/releases.js';
import AppPage from '../client/pages/hub/app-page.js';
import DevelopmentPage from '../client/pages/hub/tabs/development-page.js';
import DeploymentsPage from '../client/pages/hub/tabs/deployments-page.js';
import ReleasesPage from '../client/pages/hub/tabs/releases-page.js';
import SettingsPage from '../client/pages/hub/tabs/settings-page.js';
import { Detail } from '../client/pages/hub/detail.js';
import { ApplicationsCatalog } from '../client/pages/hub-page.js';
import { ErrorNotification } from '../client/pages/hub/shared.js';
import { readError } from '../client/pages/hub/utils.js';
import { ApiClientError } from '@nocobase/app-client';
import enUS from '../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-hub': enUS },
});
function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace='@nocobase/app-plugin-hub'>
      {children}
    </TestI18nProvider>
  );
}

const appSummary = (id: string, name = id): AppSummary => ({
  app: {
    id,
    name,
    currentDeploymentId: 'deployment-1',
    updatedAt: '2026-09-11T00:00:00Z',
  },
  runtime: { hostAvailable: true, state: 'running' },
  currentVersion: '1.0.0',
  hasReleases: true,
  hasPendingDeployment: false,
  enabled: true,
  startupMode: 'eager',
});

/** A list response, all on one page. */
const list = <T,>(data: readonly T[]) => ({
  data,
  meta: { page: 1, pageSize: 100, total: data.length },
});

const page = (
  items: readonly AppSummary[],
  overrides: Partial<PageMeta> = {},
): ListResponse<AppSummary> => ({
  data: items,
  meta: { total: items.length, page: 1, pageSize: 24, ...overrides },
});

const renderCatalog = (): void => {
  render(
    <MemoryRouter initialEntries={['/apps']}>
      <ApplicationsCatalog />
    </MemoryRouter>,
    { wrapper: I18n },
  );
};

const deferred = <T,>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

const detail = (overrides: Partial<AppOverview> = {}): AppOverview => ({
  app: {
    id: 'customer',
    name: 'Customer',
    currentDeploymentId: 'deployment-1',
    updatedAt: '2026-09-11T00:00:00Z',
  },
  runtime: { hostAvailable: true, state: 'running' },
  currentVersion: '1.0.0',
  hasReleases: true,
  hasPendingDeployment: false,
  enabled: true,
  startupMode: 'eager',
  deployment: {
    desiredReleaseId: 'release-1',
    observedReleaseId: 'release-1',
    observedState: 'running',
    activation: 'eager',
    basePath: '/customer',
    updatedAt: '2026-09-11T00:00:00Z',
  },
  hostUrl: null,
  ...overrides,
});

const renderAppPage = (
  initialEntry: string,
  appDetail: AppOverview = detail(),
): void => {
  function HistoryControls(): ReactElement {
    const navigate = useNavigate();
    return (
      <>
        <button onClick={() => void navigate(-1)}>History back</button>
        <button onClick={() => void navigate(1)}>History forward</button>
      </>
    );
  }
  function DeploymentsTab(): ReactElement {
    const location = useLocation();
    return (
      <>
        <div>Deployments tab</div>
        <output data-testid='location'>
          {location.pathname}
          {location.search}
        </output>
      </>
    );
  }
  mocks.client.request.mockImplementation(({ path }: { path: string }) => {
    if (path === 'hub/apps/customer') {
      return Promise.resolve({ data: appDetail });
    }
    if (path === 'hub/apps/customer/releases') return Promise.resolve(list([]));
    if (path === 'hub/apps/customer/deployments') {
      return Promise.resolve({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0 },
      });
    }
    return Promise.reject(new Error(`Unexpected request: ${path}`));
  });
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <HistoryControls />
      <Routes>
        <Route path='/apps'>
          <Route index element={<div>Applications catalog</div>} />
          <Route path=':appId' element={<AppPage />}>
            <Route path='deployments' element={<DeploymentsTab />} />
            <Route path='releases' element={<ReleasesPage />} />
            <Route path='development' element={<DevelopmentPage />} />
            <Route path='settings' element={<SettingsPage />} />
            <Route path='*' element={<div>Unknown tab</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
    { wrapper: I18n },
  );
};

const getPaginationControl = (label: string): HTMLElement => {
  const control = document.querySelector<HTMLElement>(
    `[data-slot='pagination-link'][aria-label='${label}']`,
  );
  if (!control) {
    throw new Error(`Pagination control not found: ${label}`);
  }
  return control;
};

function Logs(): ReactElement {
  useEffect(() => {
    mocks.logMounted();
  }, []);
  const navigate = useNavigate();
  return (
    <div>
      <input aria-label='Log search' />
      <button onClick={() => void navigate('/apps/customer/deployments')}>
        Close logs
      </button>
    </div>
  );
}

describe('Hub client pages', () => {
  beforeEach(() => {
    mocks.client.request.mockReset();
    mocks.authorization.can.mockReset().mockResolvedValue(true);
    mocks.authorization.invalidate.mockReset();
    mocks.authorization.onInvalidated
      .mockReset()
      .mockReturnValue(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([false, true])(
    'shows manual refresh feedback and clears it after failure=%s',
    async (fail) => {
      renderAppPage('/apps/customer/deployments');
      const button = await screen.findByRole('button', {
        name: 'Refresh status',
      });
      let finish!: () => void;
      const response = new Promise<void>((resolve, reject) => {
        finish = () => (fail ? reject(new Error('Refresh failed')) : resolve());
      });
      mocks.client.request.mockImplementation(({ path }: { path: string }) => {
        if (path.endsWith('/refresh')) return response;
        if (path === 'hub/apps/customer')
          return Promise.resolve({ data: detail() });
        if (path.endsWith('/releases')) return Promise.resolve(list([]));
        return Promise.resolve({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0 },
        });
      });
      fireEvent.click(button);
      expect(button).toHaveTextContent('Refreshing…');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button.querySelector('svg')).toHaveClass('animate-spin');
      fireEvent.click(button);
      expect(
        mocks.client.request.mock.calls.filter(([request]) =>
          request.path.endsWith('/refresh'),
        ),
      ).toHaveLength(1);
      await act(async () => finish());
      expect(button).toHaveTextContent('Refresh status');
      expect(button).toBeEnabled();
      expect(button.querySelector('svg')).not.toHaveClass('animate-spin');
    },
  );

  it.each([false, true])(
    'animates only during automatic requests and clears after failure=%s',
    async (fail) => {
      vi.useFakeTimers();
      renderAppPage(
        '/apps/customer/deployments',
        detail({ hasPendingDeployment: true }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      const button = screen.getByRole('button', { name: 'Refresh status' });
      let finish!: () => void;
      const response = new Promise<unknown>((resolve, reject) => {
        finish = () =>
          fail
            ? reject(new Error('Temporary failure'))
            : resolve({ data: detail({ hasPendingDeployment: true }) });
      });
      mocks.client.request.mockImplementation(({ path }: { path: string }) => {
        if (path === 'hub/apps/customer') return response;
        if (path.endsWith('/releases')) return Promise.resolve(list([]));
        return Promise.resolve({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0 },
        });
      });
      expect(button.querySelector('svg')).not.toHaveClass('animate-spin');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(button).toHaveTextContent('Refresh status');
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toHaveClass('animate-spin');
      fireEvent.click(button);
      expect(
        mocks.client.request.mock.calls.some(([request]) =>
          request.path.endsWith('/refresh'),
        ),
      ).toBe(false);
      await act(async () => finish());
      expect(button).toBeEnabled();
      expect(button.querySelector('svg')).not.toHaveClass('animate-spin');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(button).toBeEnabled();
    },
  );

  it.each(['running', 'failed'] as const)(
    'polls unchanged pending states until %s and stops',
    async (state) => {
      vi.useFakeTimers();
      renderAppPage(
        '/apps/customer/deployments',
        detail({ hasPendingDeployment: true }),
      );
      await act(async () => {
        await Promise.resolve();
      });
      let calls = 0;
      mocks.client.request.mockImplementation(({ path }: { path: string }) => {
        if (path === 'hub/apps/customer') {
          calls += 1;
          return Promise.resolve({
            data: detail({
              hasPendingDeployment: calls < 3,
              runtime: {
                hostAvailable: true,
                state: calls < 3 ? 'running' : state,
              },
            }),
          });
        }
        if (path.endsWith('/releases')) return Promise.resolve(list([]));
        return Promise.resolve({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0 },
        });
      });
      for (let i = 1; i <= 3; i += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1_500);
        });
        expect(calls).toBe(i);
      }
      expect(
        screen.getByText(/Deployment or startup has finished/),
      ).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(calls).toBe(3);
      expect(
        mocks.client.request.mock.calls.filter(
          ([request]) => request.path === 'hub/apps/customer/deployments',
        ).length,
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it('retries transient polling failures and cancels polling on unmount', async () => {
    vi.useFakeTimers();
    renderAppPage(
      '/apps/customer/deployments',
      detail({ hasPendingDeployment: true }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    let calls = 0;
    mocks.client.request.mockImplementation(({ path }: { path: string }) => {
      if (path === 'hub/apps/customer') {
        calls += 1;
        if (calls === 1) return Promise.reject(new Error('offline'));
        return Promise.resolve({
          data: detail({ hasPendingDeployment: true }),
        });
      }
      if (path.endsWith('/releases')) return Promise.resolve(list([]));
      return Promise.resolve({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0 },
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(screen.getByText(/Status updates interrupted/)).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(calls).toBe(2);
    expect(
      screen.queryByText(/Status updates interrupted/),
    ).not.toBeInTheDocument();
    cleanup();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(calls).toBe(2);
  });

  it('requires confirmation before deleting an owned App and returns to the catalog', async () => {
    renderAppPage('/apps/customer/settings');
    const requestedDeletion = () =>
      mocks.client.request.mock.calls.some(
        ([request]) => request.method === 'DELETE',
      );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove application' }),
    );
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(requestedDeletion()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(requestedDeletion()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove application' }));
    mocks.client.request.mockResolvedValueOnce({ data: {} });
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove', exact: true }),
    );
    await screen.findByText('Applications catalog');
    expect(mocks.client.request).toHaveBeenCalledWith({
      path: 'hub/apps/customer',
      method: 'DELETE',
    });
  });

  it('hides deletion when the App removal permission is denied', async () => {
    mocks.authorization.can.mockImplementation(
      ({ action }: { action: string }) => Promise.resolve(action !== 'remove'),
    );
    renderAppPage('/apps/customer/settings');
    await screen.findByText('Application settings');
    expect(
      screen.queryByRole('button', { name: 'Remove application' }),
    ).not.toBeInTheDocument();
  });

  it('edits the App name, rejects blank input, and refreshes the saved heading', async () => {
    renderAppPage('/apps/customer/settings');
    const input = await screen.findByLabelText('Application name');
    const save = screen.getByRole('button', { name: 'Save settings' });
    expect(input).toHaveValue('Customer');
    expect(save).toBeDisabled();
    fireEvent.change(input, { target: { value: '   ' } });
    expect(save).toBeDisabled();
    fireEvent.change(input, { target: { value: '  New name  ' } });
    expect(save).toBeEnabled();
    mocks.client.request.mockImplementation(
      ({ path, method }: { path: string; method?: string }) => {
        if (method === 'PATCH') return Promise.resolve({ data: {} });
        if (path === 'hub/apps/customer')
          return Promise.resolve({
            data: detail({ app: { ...detail().app, name: 'New name' } }),
          });
        return Promise.resolve({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0 },
        });
      },
    );
    fireEvent.click(save);
    await screen.findByRole('heading', { name: 'New name' });
    expect(mocks.client.request).toHaveBeenCalledWith({
      path: 'hub/apps/customer/settings',
      method: 'PATCH',
      json: { name: 'New name', activation: 'eager' },
    });
    expect(
      screen.getByRole('textbox', { name: 'Application name', exact: true }),
    ).toHaveValue('New name');
    expect(
      screen.getByRole('button', { name: 'Save settings' }),
    ).toBeDisabled();
  });

  it('keeps an unsaved name and shows a notification when saving fails', async () => {
    renderAppPage('/apps/customer/settings');
    fireEvent.change(await screen.findByLabelText('Application name'), {
      target: { value: 'Draft name' },
    });
    mocks.client.request.mockRejectedValueOnce(
      new Error('Could not save name'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await screen.findByText('Could not save name');
    expect(
      screen.getByRole('textbox', { name: 'Application name', exact: true }),
    ).toHaveValue('Draft name');
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
  });

  it('requires a manually entered ID on every creation', async () => {
    mocks.client.request.mockImplementation(({ method }: { method?: string }) =>
      Promise.resolve(method === 'POST' ? { data: {} } : { ...page([]) }),
    );
    renderCatalog();
    const ids: string[] = [];
    for (let count = 0; count < 2; count += 1) {
      fireEvent.click(
        await screen.findByRole('button', { name: 'New application' }),
      );
      fireEvent.change(
        screen.getByRole('textbox', { name: 'Application name', exact: true }),
        {
          target: { value: 'TMS' },
        },
      );
      expect(screen.getByLabelText(/Application ID/)).toHaveValue('');
      expect(screen.getByLabelText(/Application ID/)).toBeRequired();
      expect(
        screen.getByRole('button', { name: 'Create application' }),
      ).toBeDisabled();
      fireEvent.change(screen.getByLabelText(/Application ID/), {
        target: { value: '   ' },
      });
      expect(
        screen.getByRole('button', { name: 'Create application' }),
      ).toBeDisabled();
      fireEvent.change(screen.getByLabelText(/Application ID/), {
        target: { value: '__reserved' },
      });
      expect(
        screen.getByRole('button', { name: 'Create application' }),
      ).toBeDisabled();
      fireEvent.submit(
        screen.getByLabelText(/Application ID/).closest('form')!,
      );
      expect(
        mocks.client.request.mock.calls.filter(([r]) => r.method === 'POST'),
      ).toHaveLength(count);
      fireEvent.change(screen.getByLabelText(/Application ID/), {
        target: { value: `tms-${count}` },
      });
      ids.push(
        (screen.getByLabelText(/Application ID/) as HTMLInputElement).value,
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Create application' }),
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(mocks.client.request).toHaveBeenCalledWith({
        path: 'hub/apps',
        method: 'POST',
        json: { id: ids[count], name: 'TMS' },
      });
    }
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('preserves manually entered IDs when names change and reports conflicts', async () => {
    const conflict = new ApiClientError('ID conflict', {
      status: 409,
      reason: 'APP_EXISTS',
      domain: 'hub',
      payload: {
        error: {
          code: 409,
          reason: 'APP_EXISTS',
          domain: 'hub',
          message: 'Application ID is unavailable.',
        },
      },
    });
    mocks.client.request.mockImplementation(
      ({ method }: { method?: string }) =>
        method === 'POST'
          ? Promise.reject(conflict)
          : Promise.resolve({ ...page([]) }),
    );
    renderCatalog();
    fireEvent.click(
      await screen.findByRole('button', { name: 'New application' }),
    );
    const name = screen.getByRole('textbox', {
      name: 'Application name',
      exact: true,
    });
    const id = screen.getByLabelText(/Application ID/);
    fireEvent.change(name, { target: { value: 'TMS' } });
    expect(id).toHaveValue('');
    fireEvent.change(id, { target: { value: 'tms' } });
    fireEvent.change(name, { target: { value: 'My TMS' } });
    expect(id).toHaveValue('tms');
    fireEvent.click(screen.getByRole('button', { name: 'Create application' }));
    expect(
      await screen.findByText('Application ID is unavailable'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(name).toHaveValue('My TMS');
    expect(id).toHaveValue('tms');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).queryByText(
        'Application ID is unavailable',
      ),
    ).not.toBeInTheDocument();
  });

  it('debounces catalog search and sends the trimmed query to the server', async () => {
    mocks.client.request.mockResolvedValue({
      ...page([appSummary('customer', 'Customer Portal')]),
    });
    renderCatalog();

    await waitFor(() =>
      expect(mocks.client.request).toHaveBeenCalledWith({
        path: 'hub/apps',
        query: { q: undefined, page: 1, pageSize: 24 },
      }),
    );
    const input = screen.getByPlaceholderText('Search applications…');
    fireEvent.change(input, { target: { value: ' customer ' } });

    await new Promise((resolve) => window.setTimeout(resolve, 320));
    expect(mocks.client.request).toHaveBeenLastCalledWith({
      path: 'hub/apps',
      query: { q: 'customer', page: 1, pageSize: 24 },
    });
  });

  it('resets the catalog page when the search changes', async () => {
    mocks.client.request.mockImplementation(
      ({ query }: { query?: { page?: number } }) =>
        Promise.resolve({
          ...page([appSummary(`app-${query?.page ?? 1}`)], {
            total: 48,
            page: query?.page ?? 1,
          }),
        }),
    );
    renderCatalog();

    await waitFor(() =>
      expect(getPaginationControl('Go to page 2')).toBeInTheDocument(),
    );
    fireEvent.click(getPaginationControl('Go to page 2'));
    await waitFor(() =>
      expect(mocks.client.request).toHaveBeenLastCalledWith({
        path: 'hub/apps',
        query: { q: undefined, page: 2, pageSize: 24 },
      }),
    );

    fireEvent.change(screen.getByPlaceholderText('Search applications…'), {
      target: { value: 'customer' },
    });
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    expect(mocks.client.request).toHaveBeenLastCalledWith({
      path: 'hub/apps',
      query: { q: 'customer', page: 1, pageSize: 24 },
    });
  });

  it('keeps the previous catalog visible while loading another page', async () => {
    const nextPage = deferred<ListResponse<AppSummary>>();
    mocks.client.request.mockImplementation(
      ({ query }: { query?: { page?: number } }) =>
        query?.page === 2
          ? nextPage.promise
          : Promise.resolve({
              ...page([appSummary('first', 'First application')], {
                total: 48,
              }),
            }),
    );
    renderCatalog();

    await waitFor(() =>
      expect(screen.getByText('First application')).toBeInTheDocument(),
    );
    fireEvent.click(getPaginationControl('Go to next page'));
    expect(screen.getByText('First application')).toBeInTheDocument();
    await waitFor(() =>
      expect(mocks.client.request).toHaveBeenLastCalledWith({
        path: 'hub/apps',
        query: { q: undefined, page: 2, pageSize: 24 },
      }),
    );

    nextPage.resolve({
      ...page([appSummary('second', 'Second application')], {
        total: 48,
        page: 2,
      }),
    });
    await waitFor(() =>
      expect(screen.getByText('Second application')).toBeInTheDocument(),
    );
  });

  it('ignores an older search response when a newer query finishes first', async () => {
    const firstSearch = deferred<ListResponse<AppSummary>>();
    const secondSearch = deferred<ListResponse<AppSummary>>();
    mocks.client.request.mockImplementation(
      ({ query }: { query?: { q?: string } }) => {
        if (query?.q === 'a') return firstSearch.promise;
        if (query?.q === 'ab') return secondSearch.promise;
        return Promise.resolve({ ...page([]) });
      },
    );
    renderCatalog();
    await waitFor(() => expect(mocks.client.request).toHaveBeenCalled());

    const input = screen.getByPlaceholderText('Search applications…');
    fireEvent.change(input, { target: { value: 'a' } });
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    await waitFor(() =>
      expect(mocks.client.request).toHaveBeenLastCalledWith({
        path: 'hub/apps',
        query: { q: 'a', page: 1, pageSize: 24 },
      }),
    );

    fireEvent.change(input, { target: { value: 'ab' } });
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    secondSearch.resolve({
      ...page([appSummary('ab', 'AB application')]),
    });
    await waitFor(() =>
      expect(screen.getByText('AB application')).toBeInTheDocument(),
    );

    firstSearch.resolve({
      ...page([appSummary('a', 'A application')]),
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(screen.queryByText('A application')).not.toBeInTheDocument();
    expect(screen.getByText('AB application')).toBeInTheDocument();
  });

  it('uses the same catalog data source for Grid and List views', async () => {
    mocks.client.request.mockResolvedValue({
      ...page([appSummary('customer', 'Customer Portal')]),
    });
    renderCatalog();
    await waitFor(() =>
      expect(screen.getByText('Customer Portal')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getByText('Customer Portal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(screen.getByText('Customer Portal')).toBeInTheDocument();
  });

  it('uses a user-facing label for an unresolved catalog status', async () => {
    mocks.client.request.mockResolvedValue({
      ...page([
        {
          ...appSummary('customer', 'Customer Portal'),
          runtime: { hostAvailable: true, state: 'unknown' },
        },
      ]),
    });
    renderCatalog();

    await waitFor(() =>
      expect(screen.getByText('Customer Portal')).toBeInTheDocument(),
    );
    expect(screen.getByText('Status unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });

  it('notifies a friendly restart failure while keeping raw details collapsed', async () => {
    const rawMessage = 'Restart failed: App "hdsp" failed to reload';
    const apiError = new ApiClientError(rawMessage, {
      status: 503,
      reason: 'RESTART_FAILED',
      domain: 'hub',
      payload: {
        error: {
          code: 503,
          reason: 'RESTART_FAILED',
          domain: 'hub',
          message: rawMessage,
        },
      },
    });
    render(<ErrorNotification error={readError(apiError)} />, {
      wrapper: I18n,
    });

    expect(await screen.findByText('Restart failed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The application could not be restarted. Check its deployment status and try again.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(rawMessage)).not.toBeInTheDocument();
    expect(screen.getByText('Show technical details')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show technical details'));
    expect(
      screen.getByText((content) => content.includes('failed to reload')),
    ).toBeInTheDocument();
  });

  it('keeps a replacing error on screen and reports neither the replaced nor the unmounted one as dismissed', async () => {
    const onClose = vi.fn();
    const view = render(
      <ErrorNotification message='First failure' onClose={onClose} />,
      { wrapper: I18n },
    );
    expect(await screen.findByText('First failure')).toBeInTheDocument();

    view.rerender(
      <ErrorNotification message='Second failure' onClose={onClose} />,
    );
    expect(await screen.findByText('Second failure')).toBeInTheDocument();
    expect(screen.queryByText('First failure')).not.toBeInTheDocument();

    view.unmount();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('reports an error notification that closed on its own', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<ErrorNotification message='Timed failure' onClose={onClose} />, {
      wrapper: I18n,
    });

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes the lifecycle confirmation before showing a restart failure', async () => {
    const rawMessage = 'Restart failed: App "hdsp" failed to reload';
    const apiError = new ApiClientError(rawMessage, {
      status: 503,
      reason: 'RESTART_FAILED',
      domain: 'hub',
      payload: {
        error: {
          code: 503,
          reason: 'RESTART_FAILED',
          domain: 'hub',
          message: rawMessage,
        },
      },
    });
    renderAppPage('/apps/customer/deployments');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled(),
    );
    mocks.client.request.mockImplementation(({ path }: { path: string }) =>
      path === 'hub/apps/customer/restart'
        ? Promise.reject(apiError)
        : Promise.reject(new Error(`Unexpected request: ${path}`)),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(screen.getByText('Restart Customer?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await waitFor(() =>
      expect(screen.getByText('Restart failed')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Restart Customer?')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'The application could not be restarted. Check its deployment status and try again.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Show technical details')).toBeInTheDocument();
  });

  it('opens Deployments for a deployed app and preserves the parent query', async () => {
    renderAppPage('/apps/customer?filter=recent');

    await waitFor(() =>
      expect(screen.getByText('Deployments tab')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/apps/customer/deployments?filter=recent',
    );
  });

  it('opens the combined workspace before the first deployment', async () => {
    renderAppPage(
      '/apps/customer',
      detail({ app: { ...detail().app, currentDeploymentId: null } }),
    );
    expect(await screen.findByText('Deployments tab')).toBeInTheDocument();
  });

  it('redirects an explicit Releases URL to the combined workspace', async () => {
    renderAppPage('/apps/customer/releases');
    expect(await screen.findByText('Deployments tab')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/apps/customer/deployments',
    );
  });

  it('guides new and existing projects and links to Releases with the query intact', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      'navigator',
      Object.create(navigator, { clipboard: { value: { writeText } } }),
    );
    renderAppPage(
      '/apps/customer/development?filter=recent',
      detail({
        hasReleases: false,
        app: { ...detail().app, currentDeploymentId: null },
      }),
    );
    expect(await screen.findByText('New project')).toBeInTheDocument();
    expect(screen.getByText('Existing project')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Existing project' }));
    expect(
      screen.queryByRole('button', { name: 'Copy create-app command' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Prepare your project')).not.toBeInTheDocument();
    expect(screen.getByText('Build the release')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New project' }));
    expect(
      screen.getByRole('button', { name: 'Copy create-app command' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('pnpm create @nocobase/app customer'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Build a CRM application based on this NocoBase 3 project template.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy example prompt' }),
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        'Build a CRM application based on this NocoBase 3 project template.',
      ),
    );
    expect(screen.getByText('pnpm build --tar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy build command' }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('pnpm build --tar'),
    );
    expect(
      screen.getByRole('link', { name: 'Go to Releases & deployments' }),
    ).toHaveAttribute('href', '/apps/customer/deployments?filter=recent');
    fireEvent.click(
      screen.getByRole('link', { name: 'Go to Releases & deployments' }),
    );
    expect(await screen.findByText('Deployments tab')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(await screen.findByText('Existing project')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'History forward' }));
    expect(await screen.findByText('Deployments tab')).toBeInTheDocument();
  });

  it('reports clipboard failures and hides inaccessible onboarding destinations', async () => {
    vi.stubGlobal(
      'navigator',
      Object.create(navigator, {
        clipboard: {
          value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
        },
      }),
    );
    mocks.authorization.can.mockImplementation(
      ({ action }: { action: string }) =>
        Promise.resolve(
          action !== 'read-release' && action !== 'read-deployment',
        ),
    );
    renderAppPage(
      '/apps/customer/development',
      detail({
        hasReleases: false,
        app: { ...detail().app, currentDeploymentId: null },
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Copy build command' }),
    );
    expect(
      await screen.findByText(
        'Could not copy. Select and copy the text manually.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Go to Releases & deployments' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Go to Deployments' }),
    ).not.toBeInTheDocument();
  });

  it('accepts a dragged release artifact in the upload dialog', async () => {
    mocks.client.request.mockImplementation(({ path }: { path: string }) => {
      if (path === 'hub/apps/customer') {
        return Promise.resolve({ data: detail() });
      }
      if (path === 'hub/apps/customer/releases') {
        return Promise.resolve(list([]));
      }
      if (path.endsWith('/deployments'))
        return Promise.resolve({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0 },
        });
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    render(
      <MemoryRouter initialEntries={['/apps/customer/deployments']}>
        <Routes>
          <Route path='/apps'>
            <Route path=':appId' element={<AppPage />}>
              <Route path='releases' element={<ReleasesPage />} />
              <Route path='deployments' element={<DeploymentsPage />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Upload release' }),
    );
    const zone = await screen.findByLabelText(
      'Click or drag a .tar.gz / .tgz artifact here',
    );
    expect(zone).not.toHaveAttribute('accept');
    expect(zone).toHaveAttribute('type', 'file');
    fireEvent.change(zone, {
      target: {
        files: [new File(['artifact'], 'picked.tar.gz', { type: '' })],
      },
    });
    expect(screen.getByText('picked.tar.gz')).toBeInTheDocument();
    fireEvent.change(zone, {
      target: { files: [new File(['text'], 'notes.txt')] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select exactly one .tar.gz or .tgz file.',
    );
    expect(screen.getByText('picked.tar.gz')).toBeInTheDocument();
    expect(
      mocks.client.request.mock.calls.some(
        ([request]) => request.method === 'POST',
      ),
    ).toBe(false);

    // A drag carrying no file has nothing to upload, so it neither highlights the zone nor clears the selection.
    fireEvent.dragOver(zone, {
      dataTransfer: { files: [], types: ['text/plain'] },
    });
    expect(
      screen.queryByText('Drop to select this artifact'),
    ).not.toBeInTheDocument();
    fireEvent.dragOver(zone, { dataTransfer: { files: [], types: ['Files'] } });
    expect(
      screen.getByText('Drop to select this artifact'),
    ).toBeInTheDocument();

    const file = new File(['artifact'], 'dist.tar.gz', {
      type: 'application/gzip',
    });
    fireEvent.drop(zone, { dataTransfer: { files: [file], types: ['Files'] } });

    expect(await screen.findByText('dist.tar.gz')).toBeInTheDocument();
    expect(
      screen.queryByText('Drop to select this artifact'),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Upload release',
      }),
    ).toBeEnabled();

    fireEvent.drop(zone, {
      dataTransfer: { files: [file], types: ['text/plain'] },
    });
    expect(screen.getByText('dist.tar.gz')).toBeInTheDocument();
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [new File(['text'], 'notes.txt')],
        types: ['Files'],
      },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select exactly one .tar.gz or .tgz file.',
    );
    expect(screen.getByText('dist.tar.gz')).toBeInTheDocument();
    fireEvent.drop(zone, {
      dataTransfer: { files: [file, file], types: ['Files'] },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(zone, {
      target: { files: [new File(['artifact'], 'updated.tgz')] },
    });
    expect(screen.getByText('updated.tgz')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('defaults the deploy dialog to the newest release rather than the running one', async () => {
    // Two uploads of the same version: "release-2" is newer, "release-1" is what the App is running (see detail()).
    const release = (id: string, createdAt: string): ReleaseRecord => ({
      id,
      version: '1.0.0-beta.22',
      size: 1,
      checksum: `${id}-checksum-abcdef`,
      hasConfigTemplate: false,
      createdAt,
    });
    mocks.client.request.mockImplementation(({ path }: { path: string }) => {
      if (path === 'hub/apps/customer') {
        return Promise.resolve({ data: detail() });
      }
      if (path === 'hub/apps/customer/deployments') {
        return Promise.resolve({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0 },
        });
      }
      if (path === 'hub/apps/customer/releases') {
        return Promise.resolve(
          list([
            release('release-2', '2026-09-14T00:00:00Z'),
            release('release-1', '2026-09-13T00:00:00Z'),
          ]),
        );
      }
      if (path === 'hub/apps/customer/config') {
        return Promise.resolve({ data: { mode: 'external', content: null } });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    render(
      <MemoryRouter initialEntries={['/apps/customer/deployments']}>
        <Routes>
          <Route path='/apps' element={<div>Applications catalog</div>} />
          <Route path='/apps/:appId' element={<AppPage />}>
            <Route path='deployments' element={<DeploymentsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    fireEvent.click(
      (
        await screen.findAllByRole('button', { name: 'Deploy v1.0.0-beta.22' })
      )[0]!,
    );

    const rows = await within(await screen.findByRole('dialog')).findAllByRole(
      'button',
      {
        name: /v1\.0\.0-beta\.22/,
      },
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('release-2-ch');
    expect(rows[0]).toHaveTextContent('Latest');
    expect(rows[0]).toHaveClass('bg-primary/5');
    expect(rows[1]).toHaveTextContent('Current');
    expect(rows[1]).not.toHaveClass('bg-primary/5');
  });

  it('refreshes history after acceptance even when the overview refresh fails', async () => {
    let accepted = false;
    mocks.client.request.mockImplementation(({ path }: { path: string }) => {
      if (path === 'hub/apps/customer') {
        if (accepted) return Promise.reject(new Error('Overview unavailable'));
        return Promise.resolve({ data: detail() });
      }
      if (path.endsWith('/deployments'))
        return Promise.resolve({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0 },
        });
      if (path.endsWith('/releases'))
        return Promise.resolve(
          list([
            {
              id: 'release-1',
              version: '1.0.0',
              size: 1,
              checksum: 'checksum',
              hasConfigTemplate: false,
              createdAt: '2026-09-18T00:00:00Z',
            },
          ]),
        );
      if (path.endsWith('/config'))
        return Promise.resolve({ data: { mode: 'external', content: null } });
      if (path.endsWith('/configTemplate'))
        return Promise.resolve({ data: { content: null } });
      if (path.endsWith('/deploy')) {
        accepted = true;
        return Promise.resolve({ data: { id: 'deployment-new' } });
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
    function Location() {
      return (
        <output data-testid='deploy-location'>{useLocation().pathname}</output>
      );
    }
    render(
      <MemoryRouter initialEntries={['/apps/customer/deployments']}>
        <Location />
        <Routes>
          <Route path='/apps/:appId' element={<AppPage />}>
            <Route path='deployments' element={<DeploymentsPage />}>
              <Route
                path=':deploymentId/logs'
                element={<div>Automatic deployment logs</div>}
              />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    const deploy = await screen.findByRole('button', { name: 'Deploy v1.0.0' });
    await waitFor(() => expect(deploy).toBeEnabled());
    // Opening the wizard loads releases and configuration before mounting its portal.
    // Flush those updates before querying the dialog, rather than racing the default query timeout.
    await act(async () => fireEvent.click(deploy));
    const dialog = within(await screen.findByRole('dialog'));
    const selectRelease = dialog.getByRole('button', { name: 'Continue' });
    await waitFor(() => expect(selectRelease).toBeEnabled());
    await act(async () => fireEvent.click(selectRelease));
    const confirmConfig = dialog.getByRole('button', { name: 'Continue' });
    await waitFor(() => expect(confirmConfig).toBeEnabled());
    await act(async () => fireEvent.click(confirmConfig));
    const confirmDeploy = dialog.getByRole('button', {
      name: 'Deploy release',
    });
    await waitFor(() => expect(confirmDeploy).toBeEnabled());
    await act(async () => fireEvent.click(confirmDeploy));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(accepted).toBe(true);
    await waitFor(() =>
      expect(
        mocks.client.request.mock.calls.filter(([r]) =>
          r.path.endsWith('/deployments'),
        ).length,
      ).toBeGreaterThan(1),
    );
    await screen.findByText('Automatic deployment logs');
    expect(screen.getByTestId('deploy-location')).toHaveTextContent(
      '/apps/customer/deployments/deployment-new/logs',
    );
    expect(screen.getByText('Automatic deployment logs')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand releases' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps manually opened logs mounted during pending deployment refreshes', async () => {
    vi.useFakeTimers();
    const mounted = mocks.logMounted.mockClear();
    mocks.client.request.mockImplementation(({ path }: { path: string }) => {
      if (path === 'hub/apps/customer')
        return Promise.resolve({
          data: detail({ hasPendingDeployment: true }),
        });
      if (path.endsWith('/releases')) return Promise.resolve(list([]));
      return Promise.resolve({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0 },
      });
    });
    render(
      <MemoryRouter
        initialEntries={['/apps/customer/deployments/deployment-1/logs']}
      >
        <Routes>
          <Route path='/apps/:appId' element={<AppPage />}>
            <Route path='deployments' element={<DeploymentsPage />}>
              <Route path=':deploymentId/logs' element={<Logs />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.change(screen.getByLabelText('Log search'), {
      target: { value: 'keep filter' },
    });
    const input = screen.getByLabelText('Log search');
    for (let i = 0; i < 3; i += 1)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_500);
      });
    expect(mounted).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Log search')).toBe(input);
    expect(input).toHaveValue('keep filter');
    fireEvent.click(screen.getByRole('button', { name: 'Close logs' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(screen.queryByLabelText('Log search')).not.toBeInTheDocument();
    expect(mounted).toHaveBeenCalledOnce();
  });

  it('renders an unavailable state for an explicit Tab without access', async () => {
    mocks.authorization.can.mockImplementation(
      ({ action }: { action: string }) =>
        Promise.resolve(action !== 'read-release'),
    );
    renderAppPage('/apps/customer/releases');

    await waitFor(() =>
      expect(
        screen.getByText('This application page is not available.'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText('Releases tab')).not.toBeInTheDocument();
  });

  it('visibly explains unavailable detail actions and keeps them accessible', () => {
    render(
      <MemoryRouter>
        <Detail
          app={{
            ...detail({
              runtime: { hostAvailable: true, state: 'deploying' },
              hasPendingDeployment: true,
            }),
            deployments: [],
            releases: [],
          }}
          busy={false}
          capabilities={{
            create: true,
            'update-settings': true,
            remove: true,
            'read-release': true,
            'upload-release': true,
            'read-config-template': true,
            'read-deployment': true,
            deploy: true,
            rollback: true,
            'read-config': true,
            'update-config': true,
            refresh: true,
            start: true,
            restart: true,
            stop: true,
          }}
          onBack={vi.fn()}
          onRefresh={vi.fn()}
          onRestart={vi.fn()}
          onStart={vi.fn()}
          onStop={vi.fn()}
          onTab={vi.fn()}
          tab='deployments'
        />
      </MemoryRouter>,
      { wrapper: I18n },
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toHaveAttribute(
      'aria-describedby',
      'hub-lifecycle-action-reason',
    );
    expect(screen.getByRole('button', { name: 'Stop' })).toHaveAttribute(
      'aria-describedby',
      'hub-stop-action-reason',
    );
    expect(screen.getByRole('button', { name: 'Visit' })).toHaveAttribute(
      'aria-describedby',
      'hub-visit-action-reason',
    );
  });
  it.each(['read-config', 'read-config-template'])(
    'hides Deploy without %s',
    async (missing) => {
      mocks.authorization.can.mockImplementation(
        ({ action }: { action: string }) => Promise.resolve(action !== missing),
      );
      mocks.client.request.mockImplementation(({ path }: { path: string }) => {
        if (path === 'hub/apps/customer')
          return Promise.resolve({ data: detail() });
        if (path.endsWith('/releases'))
          return Promise.resolve(
            list([
              {
                id: 'release-1',
                version: '1.0.0',
                size: 1,
                checksum: 'checksum',
                createdAt: '2026-09-18T00:00:00Z',
              },
            ]),
          );
        if (path.endsWith('/deployments'))
          return Promise.resolve({
            data: [],
            meta: { page: 1, pageSize: 20, total: 0 },
          });
        throw new Error(`Unexpected request: ${path}`);
      });
      render(
        <MemoryRouter initialEntries={['/apps/customer/deployments']}>
          <Routes>
            <Route path='/apps/:appId' element={<AppPage />}>
              <Route path='deployments' element={<DeploymentsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { wrapper: I18n },
      );
      await screen.findByText('checksum');
      expect(
        screen.queryByRole('button', { name: 'Deploy v1.0.0' }),
      ).not.toBeInTheDocument();
    },
  );

  it.each(['read-release', 'read-deployment', 'upload-release'])(
    'loads only authorized sections for %s',
    async (allowed) => {
      mocks.authorization.can.mockImplementation(
        ({ action }: { action: string }) => Promise.resolve(action === allowed),
      );
      mocks.client.request.mockImplementation(({ path }: { path: string }) => {
        if (path === 'hub/apps/customer')
          return Promise.resolve({ data: detail() });
        if (path.endsWith('/releases')) return Promise.resolve(list([]));
        if (path.endsWith('/deployments'))
          return Promise.resolve({
            data: [],
            meta: { page: 1, pageSize: 20, total: 0 },
          });
        throw new Error(`Unexpected request: ${path}`);
      });
      render(
        <MemoryRouter initialEntries={['/apps/customer/deployments']}>
          <Routes>
            <Route path='/apps/:appId' element={<AppPage />}>
              <Route path='deployments' element={<DeploymentsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { wrapper: I18n },
      );
      if (allowed === 'read-deployment')
        await screen.findByText('No deployments yet');
      else
        await screen.findByRole('heading', {
          name: new RegExp(enUS.releases.title),
        });
      expect(
        mocks.client.request.mock.calls.some(([r]) =>
          r.path.endsWith('/releases'),
        ),
      ).toBe(allowed === 'read-release');
      expect(
        mocks.client.request.mock.calls.some(([r]) =>
          r.path.endsWith('/deployments'),
        ),
      ).toBe(allowed === 'read-deployment');
      expect(
        Boolean(screen.queryByRole('button', { name: 'Upload release' })),
      ).toBe(allowed === 'upload-release');
      expect(
        screen.queryByRole('button', { name: /^Deploy v/ }),
      ).not.toBeInTheDocument();
    },
  );

  it('redirects the legacy release page, preserves the query, and expands an uploaded release without deploying', async () => {
    const release: ReleaseRecord = {
      id: 'uploaded-1',
      version: '2.0.0',
      checksum: 'uploaded-checksum',
      size: 20,
      createdAt: '2026-09-19T00:00:00Z',
      hasConfigTemplate: false,
    };
    let uploaded = false;
    mocks.client.request.mockImplementation(
      ({ path, method }: { path: string; method?: string }) => {
        if (path === 'hub/apps/customer')
          return Promise.resolve({ data: detail() });
        if (path.endsWith('/releases')) {
          if (method === 'POST') {
            uploaded = true;
            return Promise.resolve({ data: release });
          }
          return Promise.resolve(
            list(
              uploaded
                ? [release]
                : [{ ...release, id: 'old', version: '1.0.0' }],
            ),
          );
        }
        if (path.endsWith('/deployments'))
          return Promise.resolve({
            data: [],
            meta: { page: 1, pageSize: 20, total: 0 },
          });
        throw new Error(`Unexpected request: ${path}`);
      },
    );
    function Location(): ReactElement {
      const location = useLocation();
      return (
        <output data-testid='legacy-location'>
          {location.pathname}
          {location.search}
        </output>
      );
    }
    render(
      <MemoryRouter initialEntries={['/apps/customer/releases?filter=recent']}>
        <Location />
        <Routes>
          <Route path='/apps/:appId' element={<AppPage />}>
            <Route path='releases' element={<ReleasesPage />} />
            <Route path='deployments' element={<DeploymentsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Collapse releases' }),
    );
    expect(screen.getByTestId('legacy-location')).toHaveTextContent(
      '/apps/customer/deployments?filter=recent',
    );
    expect(
      screen.queryByRole('button', { name: 'Deploy v1.0.0' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Upload release' }));
    fireEvent.change(
      await screen.findByLabelText(
        'Click or drag a .tar.gz / .tgz artifact here',
      ),
      { target: { files: [new File(['artifact'], 'dist.tar.gz')] } },
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Upload release',
      }),
    );
    expect(
      await screen.findByRole('button', { name: 'Deploy v2.0.0' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Collapse releases' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(enUS.releases.uploaded)).toBeInTheDocument();
    expect(
      mocks.client.request.mock.calls.some(([r]) => r.path.endsWith('/deploy')),
    ).toBe(false);
  });
  it('restores latest-upload emphasis from server data and clears it only when that release is active', () => {
    const records: ReleaseRecord[] = ['newer', 'older'].map((id, index) => ({
      id,
      version: '1.0.0',
      checksum: `${id}-checksum`,
      size: 20,
      createdAt: index === 0 ? '2026-09-19T00:00:00Z' : '2026-09-18T00:00:00Z',
      hasConfigTemplate: false,
    }));
    const page = (active: string) => (
      <Releases
        app={{
          ...detail(),
          releases: records,
          deployments: [],
          deployment: { ...detail().deployment, observedReleaseId: active },
        }}
        canRead
        canUpload
        canDeploy
        busy={false}
        collapsed={false}
        onCollapsed={vi.fn()}
        onDeploy={vi.fn()}
        onUpload={vi.fn()}
      />
    );
    const first = render(page('older'), { wrapper: I18n });
    const latestRow = () => screen.getByText('newer-checks').closest('tr')!;
    expect(within(latestRow()).getByText('Latest upload')).toBeInTheDocument();
    expect(latestRow()).toHaveClass('bg-primary/5');
    expect(within(latestRow()).getByRole('button')).toHaveClass('bg-primary');
    first.unmount();
    const refreshed = render(page('older'), { wrapper: I18n });
    expect(latestRow()).toHaveClass('bg-primary/5');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    refreshed.rerender(page('newer'));
    expect(latestRow()).not.toHaveClass('bg-primary/5');
    expect(within(latestRow()).getByRole('button')).not.toHaveClass(
      'bg-primary',
    );
    expect(within(latestRow()).getByText('Active')).toBeInTheDocument();
    expect(within(latestRow()).getByText('Latest upload')).toBeInTheDocument();
    refreshed.rerender(page('older'));
    expect(latestRow()).toHaveClass('bg-primary/5');
  });
  it('does not render or load the unfinished Resources tab even with configuration permission', async () => {
    renderAppPage('/apps/customer/resources');
    await screen.findByText('This application page is not available.');
    expect(
      screen.queryByRole('tab', { name: /Resources/ }),
    ).not.toBeInTheDocument();
    expect(
      mocks.client.request.mock.calls.some(([r]) => r.path.endsWith('/config')),
    ).toBe(false);
  });
});

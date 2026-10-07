/**
 * The App page's tabs: Overview, Deployments, Variables and Settings, kept in the URL; a pending deployment request as
 * the first row of the deployments, opening its dialog over the page, and a notice under the header for an approver;
 * what the variables lack shows above every tab; Settings holds the run mode and labels, the config.yml editor and deleting the App, and is there only
 * for those who may configure or delete it.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import enUS from '../client/locales/en-US.js';
import { allPermissions } from '../shared/access.js';
import type {
  AppSummary,
  AppVariableView,
  DeploymentRequestView,
  DeploymentView,
  ReleaseView,
} from '../shared/releases.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  toasts: [] as { type: string; title: string }[],
}));
vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {
    public constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
  useApiClient: () => mocks,
  usePageBreadcrumb: () => undefined,
  useClientApplication: () => ({ services: undefined }),
  useToaster: () => ({
    show: (toast: { type: string; title: string }) => {
      mocks.toasts.push(toast);
      return 'toast';
    },
    close: () => undefined,
  }),
}));
vi.mock('@nocobase/i18n/client', () => {
  const t = (key: string, values?: Record<string, unknown>) => {
    let result: unknown = enUS;
    const parts = key.split('.');
    if (typeof values?.count === 'number')
      parts.push(`${parts.pop()!}_${values.count === 1 ? 'one' : 'other'}`);
    for (const part of parts)
      result = (result as Record<string, unknown> | undefined)?.[part];
    return typeof result === 'string'
      ? result.replace(/{{(\w+)}}/g, (_, name: string) =>
          String(values?.[name] ?? name),
        )
      : key;
  };
  return {
    useTranslation: () => ({ t, i18n: { language: 'en-US' } }),
    withNamespace: (_: string, component: unknown) => component,
  };
});

import { ApiClientError } from '@nocobase/app-client';

import { ReleasesDeleteAppImpactContext } from '../client/lib/delete-app-impact.js';
import AppPage from '../client/pages/app-page.js';
import RequestPage from '../client/pages/request-page.js';

const ALL_ACTIONS = [
  'read',
  'upload',
  'deploy',
  'deploy-protected',
  'operate',
  'configure',
  'read-logs',
  'delete',
] as const;

function summary(allowed: readonly string[] = ALL_ACTIONS): AppSummary {
  return {
    app: {
      id: 'shop',
      environmentId: 'staging',
      name: 'Shop',
      description: null,
      currentDeploymentId: 'd2',
      enabled: true,
      activation: 'eager',
      idleStopMinutes: null,
      dormantAfterHours: null,
      labels: {},
      previewOf: null,
      createdBy: 'u',
      createdVia: 'human',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    environment: {
      id: 'staging',
      name: 'Staging',
      protected: false,
      runsImages: false,
    },
    runtime: {
      available: true,
      state: 'running',
      version: '1.1.0',
      startedAt: null,
      error: null,
      lastAccessedAt: null,
    },
    url: 'https://shop.example.com/',
    currentVersion: '1.1.0',
    hasReleases: true,
    hasPendingDeployment: false,
    allowed: allowed as AppSummary['allowed'],
    variables: { missing: ['SMTP_PASSWORD'], changed: false },
  } as AppSummary;
}

const deployment = (id: string, version: string): DeploymentView =>
  ({
    id,
    appId: 'shop',
    releaseId: `r-${version}`,
    kind: 'deploy',
    rollbackTargetDeploymentId: null,
    previousDeploymentId: null,
    status: 'succeeded',
    phase: 'done',
    configMode: 'managed',
    error: null,
    actorId: null,
    actorKind: 'human',
    requestId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    startedAt: null,
    finishedAt: null,
    release: { version, checksum: 'sha256:0' },
    artifact: null,
  }) as DeploymentView;

interface Sent {
  readonly path: string;
  readonly method?: string;
  readonly json?: unknown;
}

function pendingRequest(
  overrides: Partial<DeploymentRequestView> = {},
): DeploymentRequestView {
  return {
    id: 'req-1',
    appId: 'shop',
    environmentId: 'staging',
    releaseId: 'r-1.2.0',
    releaseChecksum: 'abc',
    kind: 'deploy',
    rollbackTargetDeploymentId: null,
    status: 'pending',
    note: 'Ready for staging',
    labels: {},
    requestedBy: 'zhang',
    requestedVia: 'human',
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    deploymentId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    release: { version: '1.2.0', sourceCommit: 'c0ffee12', build: null },
    environment: { name: 'Staging', protected: false },
    decidable: true,
    ...overrides,
  };
}

function serve(
  app: AppSummary,
  requests: readonly unknown[] = [],
  configMode = 'managed',
): Sent[] {
  const sent: Sent[] = [];
  const list = (data: readonly unknown[], meta: object = {}) =>
    Promise.resolve({ data, meta: { total: data.length, ...meta } });
  mocks.request.mockImplementation((options: Sent) => {
    sent.push(options);
    if (options.path === 'releases/me')
      return Promise.resolve({
        data: { userId: 'u', kind: 'human', permissions: allPermissions() },
      });
    if (options.path === 'releases/apps/shop')
      return Promise.resolve({ data: app });
    if (options.path === 'releases/apps/shop/releases')
      return list([
        {
          id: 'r-1.1.0',
          version: '1.1.0',
          labels: {},
          size: 10,
          createdAt: '2026-10-01T00:00:00.000Z',
        } as unknown as ReleaseView,
      ]);
    if (options.path === 'releases/apps/shop/deployments')
      return list([deployment('d2', '1.1.0'), deployment('d1', '1.0.0')]);
    if (options.path === 'releases/deploymentRequests') return list(requests);
    if (options.path === 'releases/deploymentRequests/req-1')
      return Promise.resolve({ data: requests[0] });
    if (options.method === 'POST')
      return Promise.resolve({ data: { status: 'approved' } });
    if (options.path === 'releases/apps/shop/variables')
      return list(
        [
          {
            name: 'SMTP_PASSWORD',
            declared: true,
            description: null,
            secret: true,
            required: true,
            firstStartOnly: false,
            generate: null,
            source: 'unset',
            value: null,
            missing: true,
            changed: false,
            app: null,
            preview: null,
            environment: null,
          } satisfies AppVariableView,
        ],
        {
          releaseId: 'r-1.1.0',
          declared: true,
          missing: ['SMTP_PASSWORD'],
          changed: false,
        },
      );
    if (options.path === 'releases/apps/shop/config')
      return Promise.resolve({
        data:
          configMode === 'external'
            ? { mode: 'external', content: null, secrets: [] }
            : { mode: configMode, content: 'app: {}\n', secrets: [] },
      });
    if (options.path === 'releases/apps/shop/initialAdmin')
      return Promise.reject(new ApiClientError('Not found', 404 as never));
    return Promise.resolve({ data: [], meta: { total: 0 } });
  });
  return sent;
}

function Location(): ReactElement {
  const location = useLocation();
  return (
    <>
      <output data-testid='location'>{location.search}</output>
      <output data-testid='path'>{location.pathname}</output>
    </>
  );
}

function renderPage(search = '', path = '/releases/shop'): void {
  render(
    <MemoryRouter initialEntries={[`${path}${search}`]}>
      <Routes>
        <Route
          path='/releases/:appId'
          element={
            <>
              <AppPage />
              <Location />
            </>
          }
        >
          <Route path='requests/:requestId' element={<RequestPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const rowOf = async (text: string): Promise<HTMLElement> =>
  (await screen.findByText(text)).closest('tr') as HTMLElement;

afterEach(() => {
  cleanup();
  mocks.request.mockReset();
  mocks.toasts.length = 0;
});

describe('App page tabs', () => {
  it('opens on Overview, keeps the tab in the URL, and shows what the variables lack on every tab', async () => {
    serve(summary());
    renderPage();
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Deployments',
      'Variables',
      'Settings',
    ]);
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Current release')).toBeInTheDocument();
    expect(await screen.findByText('Recent deployments')).toBeInTheDocument();
    expect(
      screen.getByText('Required variables are not set'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Set on this app' }),
    ).toHaveAttribute('href', '/releases/shop?tab=variables');
    expect(
      screen.getByRole('link', { name: 'Set on environment' }),
    ).toHaveAttribute('href', '/release-environments/staging?tab=variables');

    fireEvent.click(screen.getByRole('tab', { name: 'Deployments' }));
    expect(screen.getByTestId('location')).toHaveTextContent(
      '?tab=deployments',
    );
    expect(
      await screen.findByRole('button', { name: 'Upload a release' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Required variables are not set'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Variables' }));
    expect(screen.getByTestId('location')).toHaveTextContent('?tab=variables');
    expect(
      await screen.findByText('SMTP_PASSWORD', { selector: 'div' }),
    ).toBeInTheDocument();
    // On the Variables tab the alert has nowhere else to send you.
    expect(
      screen.getByText('Required variables are not set'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Set on this app' })).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Set on environment' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^$/);
  });

  it('opens Settings from the URL, with the run mode, config.yml and deleting the App', async () => {
    serve(summary());
    renderPage('?tab=settings');
    expect(await screen.findByText('Runtime and labels')).toBeInTheDocument();
    expect(await screen.findByLabelText('config.yml')).toHaveValue('app: {}\n');
    const danger = (await screen.findByText('Delete application')).closest(
      '[data-slot="danger-zone"]',
    ) as HTMLElement;
    fireEvent.click(
      within(danger).getByRole('button', { name: 'Delete with its data' }),
    );
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('says config.yml comes with the first deployment, pointing to the variables', async () => {
    const app = summary();
    serve({ ...app, app: { ...app.app, currentDeploymentId: null } });
    renderPage('?tab=settings');
    expect(await screen.findByText('No config.yml yet')).toBeInTheDocument();
    expect(screen.queryByLabelText('config.yml')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Go to variables' }),
    ).toHaveAttribute('href', '/releases/shop?tab=variables');
  });

  it('says there is no config.yml to edit for an App configured from outside', async () => {
    serve(summary(), [], 'external');
    renderPage('?tab=settings');
    expect(
      await screen.findByText('No config.yml to edit'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Go to variables' }),
    ).toBeInTheDocument();
  });

  it('lists a pending request first among the recent deployments, with a notice and Review for an approver', async () => {
    serve(summary(), [pendingRequest()]);
    renderPage();
    const recent = (await screen.findByText('Recent deployments')).closest(
      'section',
    ) as HTMLElement;
    const rows = await within(recent).findAllByRole('row');
    const first = rows[1]!;
    expect(within(first).getByText('1.2.0')).toBeInTheDocument();
    expect(within(first).getByText('Pending')).toBeInTheDocument();
    expect(within(first).getByText('zhang')).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: 'Review' })).toHaveAttribute(
      'href',
      '/releases/shop/requests/req-1',
    );
    expect(within(rows[2]!).getByText('1.1.0')).toBeInTheDocument();
    const notice = screen
      .getByText(/requested to deploy 1\.2\.0 to Staging/u)
      .closest('[data-slot="pending-request-notice"]') as HTMLElement;
    expect(notice).toHaveAttribute('role', 'status');
    expect(within(notice).getByText('zhang')).toBeInTheDocument();
    expect(
      within(notice).getByRole('link', { name: 'Review' }),
    ).toHaveAttribute('href', '/releases/shop/requests/req-1');
  });

  it('shows the pending row with View and no notice to someone who may not decide it', async () => {
    serve(summary(), [pendingRequest({ decidable: false })]);
    renderPage();
    const row = await rowOf('1.2.0');
    expect(within(row).getByRole('link', { name: 'View' })).toBeInTheDocument();
    expect(within(row).queryByRole('link', { name: 'Review' })).toBeNull();
    expect(screen.queryByText(/requested to deploy/u)).toBeNull();
  });

  it('lists a rollback request first on the Deployments tab, opening its dialog over that tab', async () => {
    serve(summary(), [pendingRequest({ kind: 'rollback' })]);
    renderPage('?tab=deployments');
    const history = (
      await screen.findByRole('heading', { name: /^Deployments/u })
    ).closest('section') as HTMLElement;
    const first = (await within(history).findAllByRole('row'))[1]!;
    expect(within(first).getByText('Rollback')).toBeInTheDocument();
    fireEvent.click(within(first).getByRole('link', { name: 'Review' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('Review the rollback request for shop'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent(
      '/releases/shop/requests/req-1',
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      '?tab=deployments',
    );
  });

  it('decides the request in its dialog over the page, returning to the tab it came from', async () => {
    const sent = serve(summary(), [pendingRequest()]);
    renderPage('?tab=variables', '/releases/shop/requests/req-1');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(
      await within(dialog).findByLabelText('Comment (optional)'),
      { target: { value: 'Looks good' } },
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await waitFor(() =>
      expect(sent.find((item) => item.method === 'POST')).toMatchObject({
        path: 'releases/deploymentRequests/req-1/approve',
        json: { note: 'Looks good' },
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('path')).toHaveTextContent(
        /^\/releases\/shop$/u,
      ),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('?tab=variables');
  });

  it('shows what the application says deleting the App affects in its confirmation', async () => {
    serve(summary());
    const impact = {
      Impact: ({ appId }: { readonly appId: string }) => (
        <p>{`${appId} is built by acme/shop`}</p>
      ),
    };
    render(
      <ReleasesDeleteAppImpactContext.Provider value={impact}>
        <MemoryRouter initialEntries={['/releases/shop?tab=settings']}>
          <Routes>
            <Route path='/releases/:appId' element={<AppPage />} />
          </Routes>
        </MemoryRouter>
      </ReleasesDeleteAppImpactContext.Provider>,
    );
    const danger = (await screen.findByText('Delete application')).closest(
      '[data-slot="danger-zone"]',
    ) as HTMLElement;
    fireEvent.click(
      within(danger).getByRole('button', { name: 'Delete with its data' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText('shop is built by acme/shop'),
    ).toBeInTheDocument();
  });

  it('has no Settings tab for those who may neither configure nor delete the App', async () => {
    serve(summary(['read', 'deploy']));
    renderPage('?tab=settings');
    await waitFor(() =>
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
        'Overview',
        'Deployments',
        'Variables',
      ]),
    );
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByText('Runtime and labels')).toBeNull();
  });
});

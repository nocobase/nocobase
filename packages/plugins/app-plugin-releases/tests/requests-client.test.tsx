/**
 * Deployment requests in the browser: the Apps list marks an App with a pending request "Pending approval" and lists no
 * requests itself (the App's page opens them, `app-page-client.test.tsx`); the request's own dialog at
 * `requests/:requestId`, where an approver comments and approves or rejects (approving on a protected environment asks
 * for the App ID typed again, and a failure stays in the dialog); and an App's labels without the ones the assembling
 * application added, its summary in their place.
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
import type { AppSummary, DeploymentRequestView } from '../shared/releases.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  toasts: [] as { type: string; title: string }[],
}));
vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {
    public constructor(
      message: string,
      public readonly options: { status: number; reason?: string },
    ) {
      super(message);
    }
    public get status(): number {
      return this.options.status;
    }
    public get reason(): string | undefined {
      return this.options.reason;
    }
  },
  useApiClient: () => mocks,
  usePageBreadcrumb: () => undefined,
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

import { AppLabels } from '../client/components/release-badges.js';
import { ReleasesAppOriginContext } from '../client/lib/app-origin.js';
import { ReleasesSystemLabelsContext } from '../client/lib/system-labels.js';
import AppsPage from '../client/pages/apps-page.js';
import RequestPage from '../client/pages/request-page.js';

function pending(
  overrides: Partial<DeploymentRequestView> = {},
): DeploymentRequestView {
  return {
    id: 'req-1',
    appId: 'crm-production',
    environmentId: 'production',
    releaseId: 'rel-1',
    releaseChecksum: 'abcdef0123456789abcdef',
    kind: 'deploy',
    rollbackTargetDeploymentId: null,
    status: 'pending',
    note: 'Customer detail timezone fix',
    labels: {},
    requestedBy: 'zhang',
    requestedVia: 'human',
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    deploymentId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    release: {
      version: '1.4.1',
      sourceCommit: '9f8e7d6c5b4a39281706',
      build: 'https://ci.example.com/runs/42',
    },
    environment: { name: 'Production', protected: false },
    decidable: true,
    ...overrides,
  };
}

interface Sent {
  readonly path: string;
  readonly method?: string;
  readonly json?: unknown;
  readonly query?: Record<string, unknown>;
}

function app(id: string, name: string): AppSummary {
  return {
    app: {
      id,
      environmentId: 'production',
      name,
      description: null,
      currentDeploymentId: null,
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
      id: 'production',
      name: 'Production',
      protected: true,
      runsImages: false,
    },
    runtime: {
      available: true,
      state: 'running',
      version: '1.4.0',
      startedAt: null,
      error: null,
      lastAccessedAt: null,
    },
    url: null,
    currentVersion: '1.4.0',
    hasReleases: true,
    hasPendingDeployment: false,
  } as AppSummary;
}

function serve(request: DeploymentRequestView): Sent[] {
  const sent: Sent[] = [];
  mocks.request.mockImplementation((options: Sent) => {
    sent.push(options);
    if (options.path === 'releases/me')
      return Promise.resolve({
        data: { userId: 'li', kind: 'human', permissions: allPermissions() },
      });
    if (options.path === 'releases/apps')
      return Promise.resolve({
        data: [app('crm-production', 'CRM'), app('shop', 'Shop')],
        meta: { total: 2 },
      });
    if (options.path === 'releases/deploymentRequests')
      return Promise.resolve({ data: [request], meta: { total: 1 } });
    if (options.path === `releases/deploymentRequests/${request.id}`)
      return Promise.resolve({ data: request });
    if (options.method === 'POST')
      return Promise.resolve({ data: { ...request, status: 'approved' } });
    return Promise.resolve({ data: [], meta: { total: 0 } });
  });
  return sent;
}

function Where(): ReactElement {
  return <span data-testid='where'>{useLocation().pathname}</span>;
}

function renderApps(path = '/apps'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path='/apps'
          element={
            <>
              <AppsPage />
              <Where />
            </>
          }
        >
          <Route path='requests/:requestId' element={<RequestPage />} />
          <Route path=':appId' element={<span>App page</span>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  mocks.request.mockReset();
  mocks.toasts.length = 0;
});

describe('pending requests on the Apps list', () => {
  it('marks an App with a pending request "Pending approval", and lists no requests above the Apps', async () => {
    const sent = serve(pending());
    renderApps();
    const row = (await screen.findByText('CRM')).closest('tr') as HTMLElement;
    const mark = within(row).getByText('Pending approval');
    expect(mark.closest('[data-pending-approval]')).toHaveAttribute(
      'data-pending-approval',
      'mine',
    );
    const other = (await screen.findByText('Shop')).closest(
      'tr',
    ) as HTMLElement;
    expect(within(other).queryByText('Pending approval')).toBeNull();
    expect(screen.queryByText('Customer detail timezone fix')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Approve/u })).toBeNull();
    expect(
      sent.find((item) => item.path === 'releases/deploymentRequests'),
    ).toMatchObject({ query: { status: 'pending' } });
  });

  it('marks it for someone who may not decide it too', async () => {
    serve(pending({ decidable: false }));
    renderApps();
    const row = (await screen.findByText('CRM')).closest('tr') as HTMLElement;
    expect(
      within(row)
        .getByText('Pending approval')
        .closest('[data-pending-approval]'),
    ).toHaveAttribute('data-pending-approval', 'other');
  });
});

describe('a request’s own dialog', () => {
  it('says what would run where, who asked and why, and decides it', async () => {
    const sent = serve(pending());
    renderApps('/apps/requests/req-1');
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText(
        'Review the deployment request for crm-production',
      ),
    ).toBeInTheDocument();
    const details = within(dialog);
    expect(details.getByText('crm-production')).toBeInTheDocument();
    expect(details.getByText('Production')).toBeInTheDocument();
    expect(details.getByText('1.4.1')).toBeInTheDocument();
    expect(details.getByText('9f8e7d6')).toBeInTheDocument();
    expect(details.getByRole('link', { name: 'CI log' })).toHaveAttribute(
      'href',
      'https://ci.example.com/runs/42',
    );
    expect(details.getByText('zhang')).toBeInTheDocument();
    expect(
      details.getByText('Customer detail timezone fix'),
    ).toBeInTheDocument();
    fireEvent.change(details.getByLabelText('Comment (optional)'), {
      target: { value: ' Checked on staging ' },
    });
    fireEvent.click(details.getByRole('button', { name: 'Approve' }));
    await waitFor(() =>
      expect(sent.find((item) => item.method === 'POST')).toMatchObject({
        path: 'releases/deploymentRequests/req-1/approve',
        json: { note: 'Checked on staging' },
      }),
    );
    // Decided, the dialog closes onto the list.
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(/^\/apps$/u),
    );
  });

  it('asks for the App ID before approving on a protected environment', async () => {
    const sent = serve(
      pending({ environment: { name: 'Production', protected: true } }),
    );
    renderApps('/apps/requests/req-1');
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Protected')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /^Approve/u }));
    const confirm = await screen.findByRole('alertdialog');
    const approve = within(confirm).getByRole('button', { name: 'Approve' });
    expect(approve).toBeDisabled();
    fireEvent.change(within(confirm).getByRole('textbox'), {
      target: { value: 'crm-production' },
    });
    fireEvent.click(approve);
    await waitFor(() =>
      expect(sent.find((item) => item.method === 'POST')).toMatchObject({
        path: 'releases/deploymentRequests/req-1/approve',
        json: { confirm: 'crm-production' },
      }),
    );
  });

  it('rejects with the comment as its reason, asking nothing more', async () => {
    const sent = serve(pending());
    renderApps('/apps/requests/req-1');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(
      await within(dialog).findByLabelText('Comment (optional)'),
      { target: { value: 'Not this week' } },
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    await waitFor(() =>
      expect(sent.find((item) => item.method === 'POST')).toMatchObject({
        path: 'releases/deploymentRequests/req-1/reject',
        json: { note: 'Not this week' },
      }),
    );
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(/^\/apps$/u),
    );
  });

  it('keeps a failed decision in the dialog', async () => {
    const sent = serve(pending());
    const fallback = mocks.request.getMockImplementation()!;
    mocks.request.mockImplementation((options: Sent) =>
      options.method === 'POST'
        ? (sent.push(options), Promise.reject(new Error('Runtime is down')))
        : fallback(options),
    );
    renderApps('/apps/requests/req-1');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      await within(dialog).findByRole('button', { name: 'Approve' }),
    );
    expect(
      await within(dialog).findByText('The decision did not go through'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Runtime is down')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent(
      '/apps/requests/req-1',
    );
  });

  it('offers no decision to someone who may not decide it', async () => {
    serve(pending({ decidable: false }));
    renderApps('/apps/requests/req-1');
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('1.4.1')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Deployment request for crm-production'),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Approve' }),
    ).toBeNull();
    expect(within(dialog).queryByLabelText('Comment (optional)')).toBeNull();
  });
});

describe('an App’s labels', () => {
  const system = {
    explain: (key: string) =>
      ['acme', 'pr', 'repository'].includes(key) ? 'Added by Acme' : null,
  };
  const labels = {
    acme: 'preview',
    pr: '18',
    repository: 'r1',
    team: 'crm',
  };

  it('leaves out the labels the application added, showing its summary in their place', () => {
    const origin = {
      Origin: () => null,
      Summary: ({
        labels: given,
      }: {
        readonly labels: Record<string, string>;
      }) => (given.pr ? <span>{`PR #${given.pr} · acme/crm`}</span> : null),
    };
    render(
      <ReleasesSystemLabelsContext.Provider value={system}>
        <ReleasesAppOriginContext.Provider value={origin}>
          <AppLabels appId='crm-pr-18' labels={labels} />
        </ReleasesAppOriginContext.Provider>
      </ReleasesSystemLabelsContext.Provider>,
    );
    expect(screen.getByText('PR #18 · acme/crm')).toBeInTheDocument();
    expect(screen.getByText('team=crm')).toBeInTheDocument();
    expect(screen.queryByText('acme=preview')).toBeNull();
    expect(screen.queryByText('pr=18')).toBeNull();
  });

  it('shows a dash when only added labels remain and nothing summarizes them', () => {
    render(
      <ReleasesSystemLabelsContext.Provider value={system}>
        <AppLabels appId='crm' labels={{ acme: 'preview' }} />
      </ReleasesSystemLabelsContext.Provider>,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('acme=preview')).toBeNull();
  });
});

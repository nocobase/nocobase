/**
 * The client: route definitions named after the declared pages, `routes: false`, both locales covering the same
 * keys, and the Apps page rendering what the API returns with actions gated by the caller's permissions.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useEffect, useRef, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { labelsHeader, uploadLabels } from '../client/lib/format.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import { allPermissions, noPermissions } from '../shared/access.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  permissions: undefined as unknown,
  toasts: [] as { type: string; title: string }[],
}));
vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class extends Error {
    public constructor(
      message: string,
      public readonly options: {
        status: number;
        reason?: string;
        domain?: string;
      },
    ) {
      super(message);
    }
    public get status(): number {
      return this.options.status;
    }
    public get reason(): string | undefined {
      return this.options.reason;
    }
    public get domain(): string | undefined {
      return this.options.domain;
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
  const t = (key: string, values?: Record<string, string>) => {
    let result: unknown = enUS;
    for (const part of key.split('.'))
      result = (result as Record<string, unknown> | undefined)?.[part];
    return typeof result === 'string'
      ? result.replace(
          /{{(\w+)}}/g,
          (_, name: string) => values?.[name] ?? name,
        )
      : key;
  };
  return {
    useTranslation: () => ({ t, i18n: { language: 'en-US' } }),
    withNamespace: (_: string, component: unknown) => component,
  };
});

import { ApiClientError } from '@nocobase/app-client';

import { ActorName } from '../client/components/actor-name.js';
import { PeoplePicker } from '../client/components/people-picker.js';
import { errorText, messageText } from '../client/lib/errors.js';
import {
  ReleasesPeoplePickerContext,
  type PeoplePickerProps,
} from '../client/lib/people-picker.js';
import {
  useConfirmDialog,
  type ConfirmOptions,
} from '../client/components/confirm-dialog.js';
import {
  ReleasesActorNameContext,
  type ActorNameProps,
} from '../client/lib/actor-names.js';
import { ConfigSecrets } from '../client/components/config-secrets.js';
import { LabelsEditor } from '../client/components/labels-editor.js';
import {
  configSecretChanges,
  type ConfigSecretDrafts,
} from '../client/lib/config-secrets.js';
import { AppStateBadge } from '../client/components/release-badges.js';
import { labelsOf, newLabelRow, type LabelRow } from '../client/lib/labels.js';
import {
  parsePolicyDraft,
  policySummary,
} from '../client/lib/runtime-policy.js';
import { ReleasesSystemLabelsContext } from '../client/lib/system-labels.js';
import AppsPage, { AppsCatalog } from '../client/pages/apps-page.js';
import NewAppPage from '../client/pages/new-app-page.js';
import { useState } from 'react';
import plugin from '../client/plugin.js';
import { createReleasesRoutes } from '../client/routes.js';

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function NamedActor({ id, kind }: ActorNameProps): ReactElement {
  return <span>{`${kind}:${id} by name`}</span>;
}

/** What the dialog under test resolved with. */
let answer: Promise<string | null> | undefined;

/** Asks once, on mount. */
function Asker({
  options,
}: {
  readonly options: ConfirmOptions;
}): ReactElement {
  const { ask, dialog } = useConfirmDialog();
  const askedRef = useRef(false);
  useEffect(() => {
    if (askedRef.current) return;
    askedRef.current = true;
    answer = ask(options);
  }, [ask, options]);
  return dialog;
}

describe('client', () => {
  it('routes the declared pages at configurable paths', () => {
    const { routes } = createReleasesRoutes({
      appsPath: 'deploy/apps',
    }) as unknown as {
      routes: readonly { name: string; path: string; authz: unknown }[];
    };
    expect(routes.map((route) => [route.name, route.path])).toEqual([
      ['rel-apps', '/deploy/apps'],
      ['rel-environments', '/release-environments'],
    ]);
    expect(routes[0]?.authz).toEqual({
      resource: { type: 'page', id: 'rel-apps' },
      action: 'access',
    });
  });

  it('registers no routes with routes: false', () => {
    const definition = plugin({ routes: false }) as unknown as {
      routes?: unknown;
    };
    const contribution =
      typeof definition.routes === 'function'
        ? (definition.routes as (options: unknown) => unknown)({
            routes: false,
          })
        : definition.routes;
    expect(contribution ?? []).toEqual([]);
  });

  it('has the same keys in both locales', () => {
    expect(keys(zhCN).sort()).toEqual(keys(enUS).sort());
  });

  it('lists Apps and offers creation only with the create grant', async () => {
    const answer = (permissions: unknown) => (options: { path: string }) => {
      if (options.path === 'releases/me')
        return Promise.resolve({
          data: { userId: 'u', kind: 'human', permissions },
        });
      if (options.path === 'releases/apps')
        return Promise.resolve({
          data: [
            {
              app: {
                id: 'shop',
                name: 'Shop',
                labels: { branch: 'main' },
              },
              environment: {
                id: 'prod',
                name: 'Production',
                protected: true,
                runsImages: false,
              },
              runtime: {
                available: true,
                state: 'running',
                version: '1.0.0',
                startedAt: null,
                error: null,
              },
              url: null,
              currentVersion: '1.0.0',
              hasReleases: true,
              hasPendingDeployment: false,
            },
          ],
          meta: { total: 1, page: 1, pageSize: 100 },
        });
      if (options.path === 'releases/environments')
        return Promise.resolve({ data: [], meta: { total: 0 } });
      return Promise.resolve({ data: [], meta: { total: 0 } });
    };
    mocks.request.mockImplementation(answer(noPermissions()));
    const view = render(
      <MemoryRouter>
        <AppsCatalog />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('Protected')).toBeInTheDocument();
    expect(screen.getByText('branch=main')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Create app' })).toBeNull();
    view.unmount();

    mocks.request.mockImplementation(answer(allPermissions()));
    render(
      <MemoryRouter>
        <AppsCatalog />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: 'Create app' }),
      ).toBeInTheDocument(),
    );

    // Refresh reads the Apps and the pending requests again.
    const reads = (path: string) =>
      mocks.request.mock.calls.filter(
        ([options]) => (options as { path: string }).path === path,
      ).length;
    const apps = reads('releases/apps');
    const requests = reads('releases/deploymentRequests');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(reads('releases/apps')).toBe(apps + 1));
    expect(reads('releases/deploymentRequests')).toBe(requests + 1);
  });

  it('opens Create App over the list at `new` and the new App in its place', async () => {
    const sent: { path: string; method?: string; json?: unknown }[] = [];
    mocks.request.mockImplementation(
      (options: { path: string; method?: string; json?: unknown }) => {
        sent.push(options);
        if (options.path === 'releases/me')
          return Promise.resolve({
            data: { userId: 'u', kind: 'human', permissions: allPermissions() },
          });
        if (options.path === 'releases/environments')
          return Promise.resolve({
            data: [{ id: 'staging', name: 'Staging' }],
            meta: { total: 1 },
          });
        if (options.method === 'POST' && options.path === 'releases/apps')
          return Promise.resolve({ data: {} });
        return Promise.resolve({ data: [], meta: { total: 0 } });
      },
    );
    function Where(): ReactElement {
      return <span data-testid='where'>{useLocation().pathname}</span>;
    }
    render(
      <MemoryRouter initialEntries={['/apps']}>
        <Routes>
          <Route path='/apps' element={<AppsPage />}>
            <Route path='new' element={<NewAppPage />} />
            <Route path=':appId' element={<Where />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('link', { name: 'Create app' }));
    const dialog = await screen.findByRole('dialog');
    // The list stays behind the dialog.
    expect(screen.getByText('No apps yet')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Shop' },
    });
    fireEvent.change(within(dialog).getByLabelText('App ID'), {
      target: { value: 'shop' },
    });
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Create app' }),
      ).toBeEnabled(),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create app' }));
    expect(await screen.findByTestId('where')).toHaveTextContent('/apps/shop');
    expect(
      sent.find(
        (item) => item.method === 'POST' && item.path === 'releases/apps',
      ),
    ).toMatchObject({
      json: { id: 'shop', name: 'Shop', environmentId: 'staging' },
    });
  });

  it("shows an operator through the application's component, else by id", () => {
    const view = render(<ActorName id='u1' kind='human' />);
    expect(screen.getByText('u1')).toBeInTheDocument();
    view.unmount();
    render(
      <ReleasesActorNameContext.Provider value={{ Name: NamedActor }}>
        <ActorName id='u1' kind='human' />
      </ReleasesActorNameContext.Provider>,
    );
    expect(screen.getByText('human:u1 by name')).toBeInTheDocument();
  });

  it('labels an uploaded release with its commit, in a header any text survives', () => {
    expect(
      uploadLabels(' a1b2c3d ', { channel: 'beta', sha: 'ignored' }),
    ).toEqual({
      channel: 'beta',
      sha: 'a1b2c3d',
    });
    expect(uploadLabels('', {})).toEqual({});
    expect(labelsHeader({})).toBeNull();
    const header = labelsHeader({ note: '测试' })!;
    expect(header).toMatch(/^[\x20-\x7e]+$/u);
    expect(JSON.parse(header)).toEqual({ note: '测试' });
  });

  it("words the server's errors: known runtime messages, then reasons, else as sent", () => {
    const t = (key: string, values?: Record<string, unknown>) => {
      let result: unknown = enUS;
      for (const part of key.split('.'))
        result = (result as Record<string, unknown> | undefined)?.[part];
      return typeof result === 'string'
        ? result.replace(/{{(\w+)}}/g, (_, name: string) =>
            String(values?.[name] ?? name),
          )
        : String(values?.defaultValue ?? key);
    };
    expect(
      messageText(t, 'app-host child process exited before it became ready'),
    ).toBe(enUS.ui.errors.messages.hostExited);
    expect(
      messageText(
        t,
        'Start failed: app-host child process exited before it became ready',
      ),
    ).toBe(`Start failed: ${enUS.ui.errors.messages.hostExited}`);
    expect(messageText(t, 'Something else broke.')).toBe(
      'Something else broke.',
    );
    const refused = new ApiClientError('App ID may contain only letters.', {
      status: 400,
      reason: 'INVALID_APP_ID',
      domain: 'releases',
      method: 'POST',
      url: '/api/apps',
    });
    expect(errorText(t, refused, 'fallback')).toBe(
      enUS.ui.errors.reasons.INVALID_APP_ID,
    );
    const unknown = new ApiClientError('A new refusal.', {
      status: 400,
      reason: 'SOMETHING_NEW',
      domain: 'releases',
      method: 'POST',
      url: '/api/apps',
    });
    expect(errorText(t, unknown, 'fallback')).toBe('A new refusal.');
  });

  it("picks people through the application's picker, else as typed ids", () => {
    const changes: string[][] = [];
    const view = render(
      <PeoplePicker
        value={['u1']}
        onChange={(ids) => changes.push(ids)}
        placeholder='Approvers'
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Approvers'), {
      target: { value: 'u1, u2' },
    });
    expect(changes).toEqual([['u1', 'u2']]);
    view.unmount();
    function Named({ value }: PeoplePickerProps): ReactElement {
      return <span>{`picked ${value.join('+')}`}</span>;
    }
    render(
      <ReleasesPeoplePickerContext.Provider value={{ Picker: Named }}>
        <PeoplePicker value={['u1', 'u2']} onChange={() => undefined} />
      </ReleasesPeoplePickerContext.Provider>,
    );
    expect(screen.getByText('picked u1+u2')).toBeInTheDocument();
  });

  it('confirms in a dialog that waits for the typed text', async () => {
    render(
      <Asker
        options={{
          title: 'Delete shop?',
          action: 'Delete',
          destructive: true,
          typeToConfirm: 'shop',
        }}
      />,
    );
    const action = await screen.findByRole('button', { name: 'Delete' });
    expect(action).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'sho' } });
    expect(action).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'shop' },
    });
    expect(action).toBeEnabled();
    await act(async () => {
      fireEvent.click(action);
      await Promise.resolve();
    });
    await expect(answer).resolves.toBe('shop');
  });
  it('edits labels as rows of a name and a value, with messages for what cannot be saved', () => {
    const seen: Record<string, string>[] = [];
    function Editor(): ReactElement {
      const [rows, setRows] = useState<LabelRow[]>(() => [
        newLabelRow('team', 'web'),
      ]);
      seen.push(labelsOf(rows));
      return (
        <ReleasesSystemLabelsContext.Provider
          value={{
            explain: (key) => (key === 'issue' ? 'Added by the preview' : null),
          }}
        >
          <LabelsEditor
            rows={rows}
            onChange={setRows}
            systemLabels={{ issue: 'FG-1' }}
          />
        </ReleasesSystemLabelsContext.Provider>
      );
    }
    render(<Editor />);
    // A label the application added is read-only and says why it is there.
    expect(screen.getByText('issue=FG-1')).toBeInTheDocument();
    expect(screen.getByText('(Added by the preview)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add label' }));
    const name = screen.getByRole('textbox', { name: 'Name of label 2' });
    fireEvent.change(name, { target: { value: 'bad name' } });
    expect(
      screen.getByText(enUS.ui.labels.errors.keyInvalid),
    ).toBeInTheDocument();
    fireEvent.change(name, { target: { value: 'issue' } });
    expect(
      screen.getByText(enUS.ui.labels.errors.keyDuplicate),
    ).toBeInTheDocument();
    fireEvent.change(name, { target: { value: 'tier' } });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Value of label 2' }),
      {
        target: { value: 'frontend' },
      },
    );
    expect(screen.queryByText(enUS.ui.labels.errors.keyInvalid)).toBeNull();
    expect(seen.at(-1)).toEqual({ team: 'web', tier: 'frontend' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove label 1' }));
    expect(seen.at(-1)).toEqual({ tier: 'frontend' });
  });

  it('reads a runtime policy from the form and words it', () => {
    expect(
      parsePolicyDraft({
        activation: 'onDemand',
        idleStopMinutes: '10',
        dormantAfterHours: '24',
      }).policy,
    ).toEqual({
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
    expect(
      parsePolicyDraft({
        activation: 'eager',
        idleStopMinutes: '',
        dormantAfterHours: '',
      }).policy,
    ).toEqual({
      activation: 'eager',
      idleStopMinutes: null,
      dormantAfterHours: null,
    });
    expect(
      parsePolicyDraft({
        activation: 'eager',
        idleStopMinutes: '1.5',
        dormantAfterHours: '0',
      }).errors,
    ).toEqual({ idle: 'idleInvalid', dormant: 'dormantInvalid' });
    expect(
      parsePolicyDraft({
        activation: 'onDemand',
        idleStopMinutes: '30',
        dormantAfterHours: '0.25',
      }).errors,
    ).toEqual({ dormant: 'dormantBeforeIdle' });
    const t = (key: string, values?: Record<string, unknown>) =>
      `${key}${values ? JSON.stringify(values) : ''}`;
    expect(
      policySummary(t, {
        activation: 'onDemand',
        idleStopMinutes: 10,
        dormantAfterHours: 24,
      }),
    ).toBe(
      'ui.policy.activation.onDemand · ui.policy.idleSummary{"minutes":10} · ui.policy.dormantSummary{"hours":24}',
    );
  });

  it('says a stopped on-demand App starts on a visit, and a dormant one is prepared on a visit', () => {
    const summary = (state: string, activation: 'eager' | 'onDemand') =>
      ({
        app: { activation, currentDeploymentId: 'd1' },
        runtime: { state, error: null },
        hasPendingDeployment: false,
      }) as never;
    const view = render(
      <AppStateBadge summary={summary('stopped', 'onDemand')} />,
    );
    expect(screen.getByText(enUS.ui.state.stoppedOnDemand)).toBeInTheDocument();
    view.unmount();
    const dormant = render(
      <AppStateBadge summary={summary('dormant', 'onDemand')} />,
    );
    expect(screen.getByText(enUS.ui.state.dormant)).toBeInTheDocument();
    dormant.unmount();
    render(<AppStateBadge summary={summary('stopped', 'eager')} />);
    expect(screen.getByText(enUS.ui.state.stopped)).toBeInTheDocument();
  });

  it('shows config secrets write-only and turns Replace and Clear into changes', () => {
    const secrets = [
      { path: ['auth', 'secret'] },
      { path: ['users', 'initialAdmin', 'password'] },
      { path: ['webhooks', 0, 'token'] },
    ] as const;
    let latest: ConfigSecretDrafts = {};
    function Harness(): ReactElement {
      const [drafts, setDrafts] = useState<ConfigSecretDrafts>({});
      return (
        <ConfigSecrets
          secrets={secrets}
          drafts={drafts}
          onChange={(next) => {
            latest = next;
            setDrafts(next);
          }}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByText('auth.secret')).toBeInTheDocument();
    expect(screen.getByText('webhooks[0].token')).toBeInTheDocument();
    expect(screen.getAllByText('Set')).toHaveLength(3);
    expect(screen.queryByRole('textbox')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Replace users.initialAdmin.password',
      }),
    );
    const input = screen.getByLabelText(
      'New value for users.initialAdmin.password',
    );
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('');
    // A replacement left empty changes nothing.
    expect(configSecretChanges(secrets, latest)).toEqual([]);
    fireEvent.change(input, { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear auth.secret' }));
    expect(screen.getByText('Removed when you save')).toBeInTheDocument();
    expect(configSecretChanges(secrets, latest)).toEqual([
      { path: ['auth', 'secret'], value: null },
      { path: ['users', 'initialAdmin', 'password'], value: 'new-password' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(configSecretChanges(secrets, latest)).toEqual([
      { path: ['users', 'initialAdmin', 'password'], value: 'new-password' },
    ]);
  });
});

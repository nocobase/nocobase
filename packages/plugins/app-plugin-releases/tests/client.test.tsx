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
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { labelsHeader, uploadLabels } from '../client/lib/format.js';
import { newAppTarget, ReleasesPathsContext } from '../client/lib/paths.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import { allPermissions } from '../shared/access.js';

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
import AppsOutlet from '../client/pages/apps-outlet.js';
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
    // The environments open to either the environments setting or the Apps page, which a route cannot name: the page
    // decides (`environments-client.test.tsx`).
    expect(routes[1]?.authz).toBe('skip');
    expect(routes[1]?.auth).toBe('required');
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

  it('leads Create App’s old address to the one environment it names, or to the environments', () => {
    const paths = { apps: '/apps', environments: '/envs' };
    expect(newAppTarget('?environmentId=staging', paths)).toBe(
      '/envs/staging/apps/new',
    );
    expect(
      newAppTarget(
        '?environmentId=a&environmentId=b&runtimeState=running',
        paths,
      ),
    ).toBe('/envs');
    expect(newAppTarget('', paths)).toBe('/envs');
  });

  it('has the same keys in both locales', () => {
    expect(keys(zhCN).sort()).toEqual(keys(enUS).sort());
  });

  it('has no Apps list or menu entry: the Apps path alone leads to the environments, its children still open', async () => {
    const { routes } = createReleasesRoutes() as unknown as {
      routes: readonly {
        name: string;
        navigation?: unknown;
        children?: { name: string; path: string }[];
      }[];
    };
    // The environments page is the plugin's only entry; an App, a request and Create App's old address stay below.
    expect(
      routes.filter((route) => route.navigation).map((route) => route.name),
    ).toEqual(['rel-environments']);
    expect(routes[0]?.children?.map((child) => child.path)).toEqual([
      'new',
      'requests/:requestId',
      ':appId',
    ]);
    function Where(): ReactElement {
      const location = useLocation();
      return <span data-testid='where'>{location.pathname}</span>;
    }
    const view = render(
      <MemoryRouter initialEntries={['/releases']}>
        <ReleasesPathsContext.Provider
          value={{ apps: '/releases', environments: '/envs' }}
        >
          <Routes>
            <Route path='/releases' element={<AppsOutlet />}>
              <Route path=':appId' element={<p>App page</p>} />
            </Route>
            <Route path='/envs' element={<Where />} />
          </Routes>
        </ReleasesPathsContext.Provider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('where')).toHaveTextContent('/envs');
    view.unmount();
    render(
      <MemoryRouter initialEntries={['/releases/shop']}>
        <Routes>
          <Route path='/releases' element={<AppsOutlet />}>
            <Route path=':appId' element={<p>App page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('App page')).toBeInTheDocument();
  });

  it('opens Create App over an environment at `apps/new`, the environment fixed, and the new App in its place', async () => {
    const sent: { path: string; method?: string; json?: unknown }[] = [];
    const reload = vi.fn();
    mocks.request.mockImplementation(
      (options: { path: string; method?: string; json?: unknown }) => {
        sent.push(options);
        if (options.path === 'releases/me')
          return Promise.resolve({
            data: { userId: 'u', kind: 'human', permissions: allPermissions() },
          });
        if (options.path === 'releases/environments/staging')
          return Promise.resolve({ data: { id: 'staging', name: 'Staging' } });
        if (options.method === 'POST' && options.path === 'releases/apps')
          return Promise.resolve({ data: {} });
        return Promise.resolve({ data: [], meta: { total: 0 } });
      },
    );
    function Where(): ReactElement {
      return <span data-testid='where'>{useLocation().pathname}</span>;
    }
    render(
      <MemoryRouter initialEntries={['/envs/staging/apps/new']}>
        <Routes>
          <Route
            path='/envs/:environmentId'
            element={<Outlet context={{ reload }} />}
          >
            <Route path='apps/new' element={<NewAppPage />} />
          </Route>
          <Route path='/releases/:appId' element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );
    const dialog = await screen.findByRole('dialog');
    // The App goes to the environment it is created from, which cannot be changed here.
    const environment = within(dialog).getByLabelText('Environment');
    await waitFor(() => expect(environment).toHaveValue('Staging'));
    expect(environment).toHaveAttribute('readonly');
    expect(environment).toBeDisabled();
    expect(
      within(dialog).queryByRole('combobox', { name: 'Environment' }),
    ).toBeNull();
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Shop' },
    });
    fireEvent.change(within(dialog).getByLabelText('App ID'), {
      target: { value: 'shop' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Advanced (optional)' }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add label' }));
    fireEvent.change(
      within(dialog).getByRole('textbox', { name: 'Name of label 1' }),
      { target: { value: 'team' } },
    );
    fireEvent.change(
      within(dialog).getByRole('textbox', { name: 'Value of label 1' }),
      { target: { value: 'web' } },
    );
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Create app' }),
      ).toBeEnabled(),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create app' }));
    expect(await screen.findByTestId('where')).toHaveTextContent(
      '/releases/shop',
    );
    expect(reload).toHaveBeenCalledTimes(1);
    expect(
      sent.find(
        (item) => item.method === 'POST' && item.path === 'releases/apps',
      ),
    ).toMatchObject({
      json: {
        id: 'shop',
        name: 'Shop',
        environmentId: 'staging',
        labels: { team: 'web' },
      },
    });
    const create = sent.find(
      (item) => item.method === 'POST' && item.path === 'releases/apps',
    )!;
    expect(create.json).not.toHaveProperty('idleStopMinutes');
    expect(create.json).not.toHaveProperty('dormantAfterHours');
  });

  it.each([
    {
      name: 'idle override and inherited dormancy',
      idle: '10',
      dormant: null,
      expected: { idleStopMinutes: 10 },
    },
    {
      name: 'inherited idle and dormant override',
      idle: null,
      dormant: '0.5',
      expected: { dormantAfterHours: 0.5 },
    },
    {
      name: 'idle off and inherited dormancy',
      idle: '',
      dormant: null,
      expected: { idleStopMinutes: null },
    },
    {
      name: 'inherited idle and dormant off',
      idle: null,
      dormant: '',
      expected: { dormantAfterHours: null },
    },
    {
      name: 'both overrides',
      idle: '10',
      dormant: '0.5',
      expected: { idleStopMinutes: 10, dormantAfterHours: 0.5 },
    },
    {
      name: 'both off',
      idle: '',
      dormant: '',
      expected: { idleStopMinutes: null, dormantAfterHours: null },
    },
    {
      name: 'idle override and dormancy off',
      idle: '10',
      dormant: '',
      expected: { idleStopMinutes: 10, dormantAfterHours: null },
    },
    {
      name: 'idle off and dormant override',
      idle: '',
      dormant: '0.5',
      expected: { idleStopMinutes: null, dormantAfterHours: 0.5 },
    },
    {
      name: 'conflicting idle switched to inherit',
      idle: null,
      dormant: '0.5',
      discardedIdle: '60',
      expected: { dormantAfterHours: 0.5 },
    },
    {
      name: 'invalid idle switched to inherit',
      idle: null,
      dormant: '0.5',
      discardedIdle: 'not a number',
      expected: { dormantAfterHours: 0.5 },
    },
    {
      name: 'invalid dormancy switched to inherit',
      idle: '10',
      dormant: null,
      discardedDormant: 'not a number',
      expected: { idleStopMinutes: 10 },
    },
    {
      name: 'valid idle switched to inherit',
      idle: null,
      dormant: null,
      discardedIdle: '10',
      expected: {},
    },
  ])(
    'creates with $name and preserves the choice after a capacity refusal',
    async ({ idle, dormant, discardedIdle, discardedDormant, expected }) => {
      const sent: unknown[] = [];
      mocks.request.mockImplementation(
        (options: { path: string; method?: string; json?: unknown }) => {
          if (options.path === 'releases/me')
            return Promise.resolve({
              data: {
                userId: 'u',
                kind: 'human',
                permissions: allPermissions(),
              },
            });
          if (options.path === 'releases/environments/staging')
            return Promise.resolve({
              data: {
                id: 'staging',
                name: 'Staging',
                defaultIdleStopMinutes: 1,
                defaultDormantAfterHours: 0.5,
                maxApps: 2,
              },
            });
          if (options.method === 'POST' && options.path === 'releases/apps') {
            sent.push(options.json);
            if (sent.length === 1)
              return Promise.reject(
                new ApiClientError('Environment is full.', {
                  status: 409,
                  reason: 'ENVIRONMENT_FULL',
                }),
              );
            return Promise.resolve({ data: {} });
          }
          return Promise.resolve({ data: [], meta: { total: 0 } });
        },
      );
      function Where(): ReactElement {
        return <span data-testid='where'>{useLocation().pathname}</span>;
      }
      render(
        <MemoryRouter initialEntries={['/envs/staging/apps/new']}>
          <Routes>
            <Route path='/envs/:environmentId'>
              <Route path='apps/new' element={<NewAppPage />} />
            </Route>
            <Route path='/releases/:appId' element={<Where />} />
          </Routes>
        </MemoryRouter>,
      );
      const dialog = await screen.findByRole('dialog');
      fireEvent.change(within(dialog).getByLabelText('Name'), {
        target: { value: 'Shop' },
      });
      fireEvent.change(within(dialog).getByLabelText('App ID'), {
        target: { value: 'shop' },
      });
      const advanced = within(dialog).getByRole('button', {
        name: 'Advanced (optional)',
      });
      fireEvent.click(advanced);

      async function mode(label: string, choice: string): Promise<void> {
        fireEvent.click(within(dialog).getByRole('combobox', { name: label }));
        const option = await screen.findByRole('option', { name: choice });
        fireEvent.pointerDown(option, { pointerType: 'mouse' });
        fireEvent.mouseUp(option);
        fireEvent.click(option);
      }
      const timers = [
        {
          label: 'Idle timer behavior',
          input: 'Stop when unvisited for',
          value: idle,
          discarded: discardedIdle,
        },
        {
          label: 'Hibernate timer behavior',
          input: 'Hibernate when unvisited for',
          value: dormant,
          discarded: discardedDormant,
        },
      ];
      for (const timer of timers) {
        const value = timer.discarded ?? timer.value;
        if (value !== null) {
          await mode(timer.label, 'Set a custom value');
          fireEvent.change(within(dialog).getByLabelText(timer.input), {
            target: { value },
          });
        }
      }
      const createButton = within(dialog).getByRole('button', {
        name: 'Create app',
      });
      if (
        discardedIdle === '60' ||
        discardedIdle === 'not a number' ||
        discardedDormant
      )
        expect(createButton).toBeDisabled();
      for (const timer of timers) {
        if (timer.discarded !== undefined)
          await mode(timer.label, 'Use environment default');
        const input = within(dialog).getByLabelText(timer.input);
        expect(input).toHaveValue(timer.value ?? '');
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
        if (timer.value === null) expect(input).toBeDisabled();
      }
      expect(
        within(dialog).queryByText('Hibernation must come after the stop.'),
      ).toBeNull();
      expect(advanced).not.toHaveTextContent('stops after 60');
      if (discardedIdle === '10')
        expect(advanced).not.toHaveTextContent('stops after 10');
      await waitFor(() => expect(createButton).toBeEnabled());
      const payload = {
        id: 'shop',
        name: 'Shop',
        environmentId: 'staging',
        labels: {},
        activation: 'eager',
        ...expected,
      };
      fireEvent.click(createButton);
      await waitFor(() => expect(createButton).toBeEnabled());
      expect(sent).toEqual([payload]);
      expect(within(dialog).getByLabelText('Name')).toHaveValue('Shop');
      expect(within(dialog).getByLabelText('App ID')).toHaveValue('shop');
      for (const timer of timers) {
        expect(within(dialog).getByLabelText(timer.input)).toHaveValue(
          timer.value ?? '',
        );
        expect(
          within(dialog).getByRole('combobox', { name: timer.label }),
        ).toHaveTextContent(
          timer.value === null
            ? 'Use environment default'
            : 'Set a custom value',
        );
      }
      fireEvent.click(createButton);
      expect(await screen.findByTestId('where')).toHaveTextContent(
        '/releases/shop',
      );
      expect(sent).toEqual([payload, payload]);
    },
  );

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
    // A capacity refusal reads as a retryable failure, without the Host's code or its unset-limit sentinel.
    expect(
      messageText(
        t,
        '[APP_CAPACITY_EXCEEDED] App Host capacity exceeded: insufficient memory or active application capacity; retry later maxActiveApps=9007199254740991',
      ),
    ).toBe(enUS.ui.errors.messages.capacityExceeded);
    expect(
      messageText(
        t,
        '[APP_CAPACITY_EXCEEDED] Waiting for Host memory recycling; retry later',
      ),
    ).toBe(enUS.ui.errors.messages.recycleRetry);
    expect(
      messageText(t, '[APP_CAPACITY_EXCEEDED] Something the Host said'),
    ).toBe(enUS.ui.errors.messages.capacityExceeded);
    expect(messageText(t, 'Waiting for Host memory recycling')).toBe(
      enUS.ui.errors.messages.recycleWait,
    );
    expect(
      messageText(t, '[APP_CREATE_FAILED] App "shop" failed to initialize'),
    ).toBe('App "shop" failed to initialize');
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

  it('shows one state per App: a pending deployment first, with the last failure as its detail', () => {
    const summary = (
      pendingDeployment: {
        status: 'queued' | 'deploying' | 'cancelling';
        queueAhead: number | null;
      } | null,
    ) =>
      ({
        app: { activation: 'eager', currentDeploymentId: 'd1' },
        runtime: {
          state: 'failed',
          error:
            '[APP_CAPACITY_EXCEEDED] Active app capacity exceeded and no idle app can be evicted. maxActiveApps=9007199254740991',
        },
        hasPendingDeployment: pendingDeployment !== null,
        pendingDeployment,
      }) as never;
    const cases = [
      [{ status: 'queued', queueAhead: 2 }, 'Queued · 2 ahead'],
      [{ status: 'deploying', queueAhead: null }, enUS.ui.state.deploying],
      [{ status: 'deploying', queueAhead: 0 }, enUS.ui.state.waitingRecycle],
      [
        { status: 'cancelling', queueAhead: null },
        enUS.ui.deployments.statuses.cancelling,
      ],
    ] as const;
    for (const [pending, label] of cases) {
      const view = render(<AppStateBadge summary={summary(pending)} />);
      const tag = screen.getByText(label);
      expect(screen.queryByText(enUS.ui.state.failed)).toBeNull();
      expect(tag.closest('[title]')?.getAttribute('title')).toBe(
        pending.queueAhead === 0
          ? enUS.ui.errors.messages.recycleWait
          : `Last failure: ${enUS.ui.errors.messages.activeLimit}`,
      );
      view.unmount();
    }
    // Once the deployment is over, the runtime's own state shows with its reason, and no queue label stays behind.
    render(<AppStateBadge summary={summary(null)} />);
    const failed = screen.getByText(enUS.ui.state.failed);
    expect(failed.closest('[title]')?.getAttribute('title')).toBe(
      enUS.ui.errors.messages.activeLimit,
    );
    expect(screen.queryByText(/Queued|Deploying/)).toBeNull();
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

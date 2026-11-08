import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import apiKeys from '@nocobase/app-plugin-api-keys/client';
import file from '@nocobase/app-plugin-file/client';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';
import {
  defineAppRoutes,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { RouteTreeProvider } from '../../helpers/detail-route-fixture.js';
import { routeKey } from '../../../client/capability-guide/details/route-key.js';
import FeatureOverview from '../../../client/capability-guide/details/feature-overview.js';
import {
  FEATURE_OVERVIEWS,
  type FeatureOverviewId,
} from '../../../client/capability-guide/details/feature-overview-catalog.js';
import locales from '../../../client/locales/index.js';
import packageMetadata from '../../../package.json' with { type: 'json' };

async function mount(
  id: FeatureOverviewId,
  options: {
    locale?: string;
    answer?: (call: ApiCall) => unknown;
    fileRegistered?: boolean;
    managementRoutes?: readonly AppClientRegisteredRoute[];
    denied?: ReadonlySet<string>;
    checkingAccess?: boolean;
  } = {},
) {
  const calls = vi.fn((call: ApiCall) => {
    return options.answer
      ? options.answer(call)
      : {
          data:
            id === 'app-plugin-api-keys'
              ? {
                  groups: [],
                  presets: [],
                  maxScopedKeyDays: null,
                  defaultExpiresInDays: 90,
                  mayCreate: true,
                }
              : { serverPlugins: [FEATURE_OVERVIEWS[id].packageName] },
        };
  });
  const view = await renderWithApp(
    <RouteTreeProvider
      routes={options.managementRoutes ?? []}
      access={{
        denied: options.denied ?? new Set(),
        loading: options.checkingAccess ?? false,
      }}
    >
      <Link to='/capabilities/jobs'>Jobs guide</Link>
      <Link to='/capabilities/queue'>Queue guide</Link>
      <Routes>
        <Route path='/capabilities/:entryId' element={<FeatureOverview />} />
        <Route path='/account/api-keys' element={<h1>My API keys page</h1>} />
      </Routes>
    </RouteTreeProvider>,
    {
      route: `/capabilities/${id}`,
      ...(options.locale ? { locale: options.locale } : {}),
      plugins:
        id === 'app-plugin-api-keys'
          ? [apiKeys()]
          : options.fileRegistered
            ? [file()]
            : [],
      namespace: '@nocobase/app-plugin-foundation',
      namespaces: { [packageMetadata.name]: locales },
      fetch: answerApi(calls),
    },
  );
  return { ...view, calls };
}

it.each(['jobs', 'queue', 'app-plugin-mail', 'app-plugin-knowledge'] as const)(
  'keeps unavailable configuration explicit for %s without querying registrations',
  async (id) => {
    const { calls } = await mount(id);
    expect(
      screen.getByRole('heading', { name: 'This application' }),
    ).toBeVisible();
    expect(screen.getAllByText('Not available yet').length).toBeGreaterThan(0);
    expect(screen.queryByText('Configured')).not.toBeInTheDocument();
    expect(calls).not.toHaveBeenCalled();
  },
);

it('retains a draft across tabs and collapse but never carries it into another guide', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  await mount('jobs');
  const toggle = screen.getByRole('button', {
    name: 'Adjust concurrency and retries',
  });
  await user.click(toggle);
  const input = screen.getByRole('textbox', { name: 'Editable request' });
  await user.clear(input);
  await user.type(input, 'Export monthly sales');
  await user.click(screen.getByRole('tab', { name: 'Configuration steps' }));
  await user.click(screen.getByRole('tab', { name: 'Development request' }));
  await user.click(toggle);
  await user.click(toggle);
  expect(input).toHaveValue('Export monthly sales');
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(copy).toHaveBeenCalledWith('Export monthly sales');
  await user.click(screen.getByRole('link', { name: 'Queue guide' }));
  await user.click(
    screen.getByRole('button', { name: 'Adjust queue processing speed' }),
  );
  expect(
    screen.getByRole('textbox', { name: 'Editable request' }),
  ).not.toHaveValue('Export monthly sales');
});

const managementRoutes = resolveAppClientContributions([
  {
    packageName: packageMetadata.name,
    source: 'application',
    routes: [
      defineAppRoutes([
        {
          name: 'apiKeysManagement',
          path: '/account/api-keys',
          auth: 'required',
          authz: 'skip',
          componentLoader: async () => ({
            default: () => <h1>My API keys page</h1>,
          }),
        },
      ]),
    ],
  },
]).routes;

it('requires a management interface instead of inferring readiness from an installed plugin', async () => {
  const { calls, app } = await mount('app-plugin-api-keys');
  expect(
    within(
      screen.getByRole('group', { name: 'My API keys interface' }),
    ).getByText('Not configured'),
  ).toBeVisible();

  expect(
    screen.queryByRole('link', { name: 'Manage my API keys' }),
  ).not.toBeInTheDocument();
  expect(calls).not.toHaveBeenCalled();
  await act(async () => {
    await app.runtime.i18n.changeLanguage('zh-CN');
  });
  expect(
    screen.getByRole('button', {
      name: '我的 API 密钥界面',
    }),
  ).toBeVisible();
});

it('copies an editable implementation request without dispatching tasks or creating keys', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { calls } = await mount('app-plugin-api-keys');
  await user.click(
    screen.getByRole('button', {
      name: 'My API keys interface',
    }),
  );
  const input = screen.getByRole('textbox', { name: 'Editable request' });
  expect((input as HTMLTextAreaElement).value).toContain(
    'nocobase-app-plugin-api-keys',
  );
  expect((input as HTMLTextAreaElement).value).toContain('apiKeysManagement');
  await user.clear(input);
  await user.type(input, 'Add My API keys to the account menu');
  await user.click(screen.getByRole('tab', { name: 'Configuration steps' }));
  await user.click(screen.getByRole('tab', { name: 'Development request' }));
  expect(input).toHaveValue('Add My API keys to the account menu');
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(copy).toHaveBeenCalledWith('Add My API keys to the account menu');
  expect(calls).not.toHaveBeenCalled();
});

it.each(['en-US', 'zh-CN'])(
  'keeps the API Keys detail focused on setup in %s',
  async (locale) => {
    const { calls } = await mount('app-plugin-api-keys', { locale });
    expect(
      screen.getByRole('heading', {
        name: locale === 'zh-CN' ? '当前应用' : 'This application',
      }),
    ).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(calls).not.toHaveBeenCalled();
  },
);

it('offers the registered management page without loading personal keys', async () => {
  const user = userEvent.setup();
  const { calls } = await mount('app-plugin-api-keys', { managementRoutes });
  expect(screen.getByText('Configured')).toBeVisible();
  expect(
    screen.queryByRole('button', {
      name: 'My API keys interface',
    }),
  ).toBeVisible();
  expect(calls).not.toHaveBeenCalled();
  const link = screen.getByRole('link', { name: 'Manage my API keys' });
  expect(link).toHaveAttribute('href', '/account/api-keys');
  await user.click(link);
  expect(
    await screen.findByRole('heading', { name: 'My API keys page' }),
  ).toBeVisible();
});

it.each(['denied', 'loading'] as const)(
  'never offers an inaccessible management link (%s)',
  async (state) => {
    await mount('app-plugin-api-keys', {
      managementRoutes,
      denied:
        state === 'denied'
          ? new Set([routeKey(managementRoutes[0])])
          : new Set(),
      checkingAccess: state === 'loading',
    });
    expect(screen.getByText('Configured')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Manage my API keys' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'My API keys interface',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        state === 'denied'
          ? /this account cannot open it/
          : /Checking access to the management interface/,
      ),
    ).toBeVisible();
  },
);

it.each(['group', 'dynamic'] as const)(
  'does not treat a route without a usable page as the interface (%s)',
  async (kind) => {
    await mount('app-plugin-api-keys', {
      managementRoutes: [
        {
          ...managementRoutes[0],
          ...(kind === 'group'
            ? { componentLoader: undefined }
            : { path: '/account/:id/api-keys' }),
        },
      ],
    });
    expect(
      within(
        screen.getByRole('group', { name: 'My API keys interface' }),
      ).getByText('Not configured'),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Manage my API keys' }),
    ).not.toBeInTheDocument();
  },
);

const applicationRoutes = managementRoutes.map((route) => ({
  ...route,
  name: 'applicationApiKeysManagement',
  path: '/settings/api-keys',
}));

it.each([
  [false, false],
  [true, false],
  [false, true],
  [true, true],
] as const)(
  'checks the two interfaces independently (personal %s, application %s)',
  async (personal, application) => {
    const { calls } = await mount('app-plugin-api-keys', {
      managementRoutes: [
        ...(personal ? managementRoutes : []),
        ...(application ? applicationRoutes : []),
      ],
    });
    for (const [name, configured, setup, link] of [
      [
        'My API keys interface',
        personal,
        'My API keys interface',
        'Manage my API keys',
      ],
      [
        'Application API keys interface',
        application,
        'Application API keys interface',
        'Manage application API keys',
      ],
    ] as const) {
      const row = within(screen.getByRole('group', { name }));
      expect(
        row.getByText(configured ? 'Configured' : 'Not configured'),
      ).toBeVisible();
      if (configured) {
        expect(row.getByRole('link', { name: link })).toBeVisible();
        expect(screen.queryByRole('button', { name: setup })).toBeVisible();
      } else {
        const trigger = screen.getByRole('button', { name: setup });
        expect(trigger).toBeVisible();
        expect(trigger.closest('section')).not.toBeNull();
        expect(row.queryByRole('link')).not.toBeInTheDocument();
      }
    }
    expect(calls).not.toHaveBeenCalled();
  },
);

it('keeps a denied application interface configured without offering its link or setup', async () => {
  await mount('app-plugin-api-keys', {
    managementRoutes: applicationRoutes,
    denied: new Set([routeKey(applicationRoutes[0])]),
  });
  const row = within(
    screen.getByRole('group', { name: 'Application API keys interface' }),
  );
  expect(row.getByText('Configured')).toBeVisible();
  expect(row.getByText(/this account cannot open it/)).toBeVisible();
  expect(row.queryByRole('link')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', {
      name: 'Application API keys interface',
    }),
  ).toBeVisible();
});

it('copies the application interface request without assuming a credential identity or dispatching a task', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { calls } = await mount('app-plugin-api-keys');
  await user.click(
    screen.getByRole('button', {
      name: 'Application API keys interface',
    }),
  );
  const input = screen.getByRole('textbox', { name: 'Editable request' });
  expect((input as HTMLTextAreaElement).value).toContain(
    'applicationApiKeysManagement',
  );
  expect((input as HTMLTextAreaElement).value).toContain(
    'First confirm who owns application credentials',
  );
  await user.clear(input);
  await user.type(
    input,
    'Add an application API keys page under System settings',
  );
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(copy).toHaveBeenCalledWith(
    'Add an application API keys page under System settings',
  );
  expect(calls).not.toHaveBeenCalled();
});

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
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { routeKey } from '../../client/routing/route-navigation.js';
import FeatureOverview from '../../client/pages/capabilities/feature-overview.js';
import {
  FEATURE_OVERVIEWS,
  type FeatureOverviewId,
} from '../../client/pages/capabilities/feature-overview-catalog.js';
import locales from '../../client/locales/index.js';
import packageMetadata from '../../package.json' with { type: 'json' };

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

it.each(Object.keys(FEATURE_OVERVIEWS) as FeatureOverviewId[])(
  'renders complete bilingual guidance and an editable request for %s',
  async (id) => {
    const user = userEvent.setup();
    const { app, calls } = await mount(id);
    expect(
      screen.getByRole('heading', { name: 'This application' }),
    ).toBeVisible();
    if (id !== 'app-plugin-api-keys')
      expect(
        screen.getByRole('heading', { name: 'What to configure and where' }),
      ).toBeVisible();
    await user.click(
      screen.getByRole('button', {
        name:
          id === 'app-plugin-api-keys'
            ? 'Add My API keys with an Agent'
            : 'How to integrate and verify',
      }),
    );
    expect(
      screen.getByRole('textbox', { name: 'Editable request' }),
    ).not.toHaveValue('');
    await user.click(screen.getByRole('tab', { name: 'Configuration steps' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(
      id === 'app-plugin-api-keys' ? 4 : 7,
    );
    await act(async () => {
      await app.runtime.i18n.changeLanguage('zh-CN');
    });
    if (id !== 'app-plugin-api-keys')
      expect(
        screen.getByRole('heading', { name: '可以配置什么，在哪里配置' }),
      ).toBeVisible();
    await user.click(screen.getByRole('tab', { name: '开发提示词' }));
    expect(
      screen.getByRole('textbox', { name: '可编辑的需求' }),
    ).not.toHaveValue('');
    for (const [call] of calls.mock.calls) {
      expect(call.method).toBe('GET');
      expect(call.path).toBe(
        id === 'app-plugin-api-keys'
          ? 'apiKeys/scopeOptions'
          : 'foundation/registrations',
      );
    }
    if (
      id === 'app-plugin-api-keys' ||
      ['core', 'cli', 'reference'].includes(FEATURE_OVERVIEWS[id].mode)
    )
      expect(calls).not.toHaveBeenCalled();
  },
);

it.each([
  ['app-plugin-concurrency', false, true, 'Configured'],
  ['app-plugin-concurrency', false, false, 'Not configured'],
  ['app-plugin-file', true, true, 'Configured'],
  ['app-plugin-file', false, true, 'Configuration incomplete'],
  ['app-plugin-file', false, false, 'Not configured'],
] as const)(
  'checks only the required integration for %s (%s/%s)',
  async (id, client, server, expected) => {
    await mount(id, {
      fileRegistered: client,
      answer: () => ({
        data: {
          serverPlugins: server ? [FEATURE_OVERVIEWS[id].packageName] : [],
        },
      }),
    });
    expect(await screen.findByText(expected)).toBeVisible();
    expect(
      screen.getByText(/This shows basic plugin configuration/),
    ).toBeVisible();
    expect(screen.queryByText('Server plugin')).not.toBeInTheDocument();
  },
);

it.each([401, 403, 503])(
  'keeps a failed registration read unknown and preserves guidance (%s)',
  async (status) => {
    await mount('app-plugin-notification', {
      answer: () => new Response(null, { status }),
    });
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(
      screen.getByText('Configuration could not be confirmed'),
    ).toBeVisible();
    expect(screen.queryByText('Not configured')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'What it provides' }),
    ).toBeVisible();
  },
);

it('retries a failed read without scanning or writing configuration', async () => {
  const user = userEvent.setup();
  let count = 0;
  const { calls } = await mount('app-plugin-concurrency', {
    answer: () =>
      ++count === 1
        ? new Response(null, { status: 503 })
        : { data: { serverPlugins: ['@nocobase/app-plugin-concurrency'] } },
  });
  await screen.findByRole('alert');
  await user.click(
    screen.getByRole('button', { name: 'Refresh configuration status' }),
  );
  expect(await screen.findByText('Configured')).toBeVisible();
  expect(calls).toHaveBeenCalledTimes(2);
  for (const [call] of calls.mock.calls)
    expect(call).toMatchObject({
      method: 'GET',
      path: 'foundation/registrations',
    });
});

it('retains a draft across tabs and collapse but never carries it into another guide', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  await mount('jobs');
  const toggle = screen.getByRole('button', {
    name: 'How to integrate and verify',
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
    screen.getByRole('button', { name: 'How to integrate and verify' }),
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
    within(screen.getByRole('group', { name: 'My API keys' })).getByText(
      'Not configured',
    ),
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
      name: '通过 Agent 添加「我的 API 密钥」界面',
    }),
  ).toBeVisible();
});

it('copies an editable implementation request without dispatching tasks or creating keys', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { calls } = await mount('app-plugin-api-keys');
  await user.click(
    screen.getByRole('button', {
      name: 'Add My API keys with an Agent',
    }),
  );
  const input = screen.getByRole('textbox', { name: 'Editable request' });
  expect((input as HTMLTextAreaElement).value).toContain(
    'nocobase-app-plugin-api-keys',
  );
  expect((input as HTMLTextAreaElement).value).toContain('apiKeysManagement');
  expect((input as HTMLTextAreaElement).value).toContain('user-menu.tsx');
  await user.clear(input);
  await user.type(input, 'Add My API keys to the account menu');
  await user.click(screen.getByRole('tab', { name: 'Configuration steps' }));
  await user.click(screen.getByRole('tab', { name: 'Development request' }));
  expect(input).toHaveValue('Add My API keys to the account menu');
  await user.click(
    screen.getByRole('button', { name: 'Copy integration request' }),
  );
  expect(copy).toHaveBeenCalledWith('Add My API keys to the account menu');
  expect(calls).not.toHaveBeenCalled();
});

it.each(['en-US', 'zh-CN'])(
  'keeps the API Keys detail focused on setup in %s',
  async (locale) => {
    const { calls } = await mount('app-plugin-api-keys', { locale });
    expect(screen.getAllByRole('heading')).toHaveLength(3);
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
      name: 'Add My API keys with an Agent',
    }),
  ).not.toBeInTheDocument();
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
        name: 'Add My API keys with an Agent',
      }),
    ).not.toBeInTheDocument();
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
      within(screen.getByRole('group', { name: 'My API keys' })).getByText(
        'Not configured',
      ),
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
        'My API keys',
        personal,
        'Add My API keys with an Agent',
        'Manage my API keys',
      ],
      [
        'Application API keys',
        application,
        'Add Application API keys with an Agent',
        'Manage application API keys',
      ],
    ] as const) {
      const row = within(screen.getByRole('group', { name }));
      expect(
        row.getByText(configured ? 'Configured' : 'Not configured'),
      ).toBeVisible();
      if (configured) {
        expect(row.getByRole('link', { name: link })).toBeVisible();
        expect(
          screen.queryByRole('button', { name: setup }),
        ).not.toBeInTheDocument();
      } else {
        const trigger = screen.getByRole('button', { name: setup });
        expect(trigger).toBeVisible();
        expect(trigger.closest('section')).toBeNull();
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
    screen.getByRole('group', { name: 'Application API keys' }),
  );
  expect(row.getByText('Configured')).toBeVisible();
  expect(row.getByText(/this account cannot open it/)).toBeVisible();
  expect(row.queryByRole('link')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', {
      name: 'Add Application API keys with an Agent',
    }),
  ).not.toBeInTheDocument();
});

it('copies the application interface request without assuming a credential identity or dispatching a task', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { calls } = await mount('app-plugin-api-keys');
  await user.click(
    screen.getByRole('button', {
      name: 'Add Application API keys with an Agent',
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
  await user.click(
    screen.getByRole('button', { name: 'Copy integration request' }),
  );
  expect(copy).toHaveBeenCalledWith(
    'Add an application API keys page under System settings',
  );
  expect(calls).not.toHaveBeenCalled();
});

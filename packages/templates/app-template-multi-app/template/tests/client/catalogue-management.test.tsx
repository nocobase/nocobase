import {
  renderWithApp,
  answerApi,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import {
  Catalogue,
  InstanceDetail,
  TemplateDetail,
} from '../../client/pages/template-portal/views.js';
import { refreshPortal } from '../../client/pages/template-portal/data.js';
import enUS from '../../client/locales/en-US.js';
import installedPlugin from '@nocobase/app-plugin-multi-app/client';
import { pluginEnglish } from './plugin-locales.js';
const multiApp = await pluginEnglish(installedPlugin);
import metadata from '../../package.json' with { type: 'json' };

const instance = {
  id: 'teaching',
  name: 'Teaching laboratory',
  templateId: 'tpl',
  environmentId: 'local',
  status: 'active',
  revision: 1,
  createdAt: '2026-11-04T12:00:00Z',
};
const template = {
  ...instance,
  id: 'tpl',
  name: 'Reagents template',
  description: 'Laboratory records',
};
function Location() {
  return <output data-testid='location'>{useLocation().search}</output>;
}
async function mount(
  route: string,
  handler: (call: ApiCall) => unknown,
  unrestricted = true,
) {
  await renderWithApp(
    <AuthenticationProvider>
      <Location />
      <Routes>
        <Route path='/multi-app/instances' element={<Catalogue />}>
          <Route path=':id' element={<InstanceDetail />} />
        </Route>
        <Route
          path='/multi-app/templates'
          element={<Catalogue kind='templates' />}
        >
          <Route path=':id' element={<TemplateDetail />} />
        </Route>
      </Routes>
    </AuthenticationProvider>,
    {
      route,
      namespace: metadata.name,
      namespaces: {
        [metadata.name]: enUS,
        '@nocobase/app-plugin-multi-app': multiApp,
      },
      services: (app) => {
        app.container.instance(authenticationClientToken, {
          getSession: async () => ({ data: null }),
        });
        app.container.singleton(
          authorizationClientToken,
          (resolver) =>
            new AuthorizationClient(resolver.resolve(apiClientToken)),
        );
      },
      fetch: answerApi((call) => {
        if (call.path === 'authorization/permissions')
          return { data: { unrestricted, permissions: [] } };
        const result = handler(call);
        if (result !== undefined) return result;
        if (call.path === 'multiApp/templates/tpl') return { data: template };
        if (call.path === 'multiApp/templates/tpl/versions')
          return {
            data: [
              { id: 'v2', version: '2.0.0', createdAt: instance.createdAt },
            ],
            meta: { total: 1 },
          };
        if (call.path.endsWith('/runtime'))
          return {
            data: {
              state: 'running',
              currentVersion: '1.0.0',
              desiredVersion: '2.0.0',
              drifted: false,
              url: 'http://localhost/teaching/',
            },
          };
        return { data: [], meta: { total: 0 } };
      }),
    },
  );
}
it('keeps historical filters and search when paging and opens the filtered detail', async () => {
  const calls: ApiCall[] = [];
  await mount('/multi-app/instances?q=lab&status=archived', (call) => {
    if (call.path === 'multiApp/instances') {
      calls.push(call);
      return {
        data: [{ ...instance, status: 'archived' }],
        meta: { total: 21 },
      };
    }
  });
  expect(await screen.findByRole('table')).toBeVisible();
  await screen.findByRole('link', { name: instance.name });
  await userEvent.click(
    screen.getByRole('button', { name: 'Go to next page' }),
  );
  await waitFor(() =>
    expect(calls.at(-1)?.query).toMatchObject({
      q: 'lab',
      status: 'archived',
      page: '2',
    }),
  );
  expect(
    screen.getByRole('link', { name: instance.name }).getAttribute('href'),
  ).toContain('status=archived');
  expect(screen.queryByRole('link', { name: 'Enter' })).not.toBeInTheDocument();
});
it('shows actual current version and keeps row names while refreshing; denies stale data after 403', async () => {
  let failure = 0;
  await mount('/multi-app/instances', (call) => {
    if (call.path === 'multiApp/instances')
      return failure
        ? new Response(JSON.stringify({ message: 'Denied' }), {
            status: failure,
          })
        : { data: [{ ...instance, operationId: 'op' }], meta: { total: 1 } };
  });
  expect(await screen.findByText('1.0.0')).toBeVisible();
  expect(screen.getByText('Target: 2.0.0')).toBeVisible();
  expect(screen.getByRole('link', { name: instance.name })).toBeVisible();
  failure = 500;
  act(refreshPortal);
  await screen.findByText('Refresh failed; showing previous data');
  expect(screen.getByRole('link', { name: instance.name })).toBeVisible();
  failure = 403;
  act(refreshPortal);
  await screen.findByText('Access denied');
  expect(
    screen.queryByRole('link', { name: instance.name }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Create instance' }),
  ).not.toBeInTheDocument();
});
it('uses the filtered server total for template counts and hides unavailable environment columns', async () => {
  await mount('/multi-app/templates', (call) => {
    if (call.path === 'multiApp/templates')
      return { data: [template], meta: { total: 1 } };
    if (call.path === 'multiApp/instances') {
      expect(call.query?.templateId).toBe('tpl');
      return { data: [], meta: { total: 234 } };
    }
    if (call.path === 'releases/environments')
      return { data: [{ id: 'local', name: 'Local' }], meta: { total: 1 } };
  });
  expect(await screen.findByText('234')).toBeVisible();
  expect(screen.getByText('2.0.0')).toBeVisible();
  await userEvent.click(
    screen.getByRole('button', { name: `Actions for ${template.name}` }),
  );
  expect(
    await screen.findByRole('menuitem', { name: 'Create instance' }),
  ).toHaveAttribute('href', expect.stringContaining('versionId=v2'));
});
it('preserves detail tabs in the URL and shows the target only while an operation is pending', async () => {
  await mount('/multi-app/instances/teaching?status=active', (call) => {
    if (call.path === 'multiApp/instances/teaching') return { data: instance };
  });
  await screen.findByRole('heading', { name: instance.name });
  expect(await screen.findByText('1.0.0')).toBeVisible();
  expect(screen.queryByText('Target version')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Operation history' }));
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent('view=operations'),
  );
  expect(await screen.findByText('No operations yet')).toBeVisible();
  expect(
    screen.getByRole('tab', { name: 'Operation history' }),
  ).toHaveAttribute('aria-selected', 'true');
  expect(screen.queryByText('Application information')).not.toBeInTheDocument();
});
it('does not expose protected row actions to a read-only viewer', async () => {
  await mount(
    '/multi-app/templates',
    (call) =>
      call.path === 'multiApp/templates'
        ? { data: [template], meta: { total: 1 } }
        : undefined,
    false,
  );
  await userEvent.click(
    await screen.findByRole('button', { name: `Actions for ${template.name}` }),
  );
  const menu = await screen.findByRole('menu');
  expect(within(menu).getByRole('menuitem', { name: 'Details' })).toBeVisible();
  expect(
    within(menu).queryByRole('menuitem', { name: /Upload|Publish|Retire/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Create instance' }),
  ).not.toBeInTheDocument();
});

it.each(['running', 'stopped'])(
  'shows useful %s instance actions without repeating runtime status',
  async (state) => {
    await mount('/multi-app/instances?q=lab', (call) => {
      if (call.path === 'multiApp/instances')
        return { data: [instance], meta: { total: 1 } };
      if (call.path.endsWith('/runtime'))
        return {
          data: {
            state,
            currentVersion: '1.0.0',
            drifted: false,
            url: 'http://localhost/teaching/',
          },
        };
    });
    await screen.findByText('1.0.0');
    const trigger = screen.getByRole('button', {
      name: `More actions for ${instance.name}`,
    });
    expect(within(trigger.closest('td')!).getAllByRole('button')).toHaveLength(
      1,
    );
    await userEvent.click(trigger);
    expect(
      await screen.findByRole('menuitem', {
        name: state === 'running' ? 'Enter' : 'Start',
      }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining(
        state === 'running' ? '/login?' : '/teaching/start?q=lab',
      ),
    );
    expect(screen.getByRole('menuitem', { name: 'Details' })).toHaveAttribute(
      'href',
      '/multi-app/instances/teaching?q=lab',
    );
    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByRole('menuitem', {
        name: state === 'running' ? 'Stop' : 'Archive',
      }),
    ).toBeVisible();
    if (state === 'running')
      expect(
        within(menu).queryByRole('menuitem', { name: 'Start' }),
      ).not.toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', {
        name: state === 'running' ? 'Archive' : 'Stop',
      }),
    ).not.toBeInTheDocument();
  },
);

it('keeps management available but disables lifecycle actions while an operation is pending', async () => {
  await mount('/multi-app/instances', (call) => {
    if (call.path === 'multiApp/instances')
      return { data: [{ ...instance, operationId: 'op' }], meta: { total: 1 } };
    if (call.path.endsWith('/runtime'))
      return { data: { state: 'stopped', currentVersion: '1.0.0' } };
  });
  await screen.findByText('1.0.0');
  await userEvent.click(
    screen.getByRole('button', { name: `More actions for ${instance.name}` }),
  );
  expect(
    await screen.findByRole('menuitem', { name: 'Upgrade' }),
  ).toHaveAttribute('aria-disabled', 'true');
});

it('hides lifecycle shortcuts from users without management permission', async () => {
  await mount(
    '/multi-app/instances',
    (call) => {
      if (call.path === 'multiApp/instances')
        return { data: [instance], meta: { total: 1 } };
      if (call.path.endsWith('/runtime'))
        return { data: { state: 'stopped', currentVersion: '1.0.0' } };
    },
    false,
  );
  await screen.findByText('1.0.0');
  expect(
    screen.queryByRole('button', { name: 'Start' }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: `More actions for ${instance.name}` }),
  );
  const menu = await screen.findByRole('menu');
  expect(
    within(menu).queryByRole('menuitem', { name: /Upgrade|Configure|Archive/ }),
  ).not.toBeInTheDocument();
});

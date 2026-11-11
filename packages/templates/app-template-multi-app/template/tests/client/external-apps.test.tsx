import {
  renderWithApp,
  answerApi,
  type ApiCall,
} from '@nocobase/app-testing/client';
import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { beforeEach, expect, it } from 'vitest';
import ExternalDetail, {
  ApplicationSources,
  ExternalCreate,
  ExternalAppsList,
} from '../../client/pages/template-portal/external-apps.js';
import ExternalAppsLayout from '../../client/pages/template-portal/external-layout.js';
import Workbench from '../../client/pages/template-portal/my-apps.js';
import installedPlugin from '@nocobase/app-plugin-identity-provider/client';
import { pluginEnglish } from './plugin-locales.js';
const identity = await pluginEnglish(installedPlugin);
import enUS from '../../client/locales/en-US.js';
import metadata from '../../package.json' with { type: 'json' };
beforeEach(() => {
  // Each scenario starts a fresh form session; an uncertain 500 must not leave its receipt in the next test.
  sessionStorage.removeItem('nocobase:submission:external-app-create');
});

function SourceNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const external =
    new URLSearchParams(location.search).get('source') === 'external';
  return (
    <>
      <output data-testid='location'>
        {location.pathname + location.search}
      </output>
      <ApplicationSources external={external}>
        <p>
          {external
            ? 'Connected applications list'
            : 'Managed applications list'}
        </p>
      </ApplicationSources>
      <button
        onClick={async () => {
          await navigate(-1);
        }}
      >
        Back
      </button>
    </>
  );
}
async function mount(
  path: string,
  handler: (call: ApiCall) => unknown,
  unrestricted = true,
) {
  await renderWithApp(
    <AuthenticationProvider>
      <Routes>
        <Route path='/detail/:id' element={<ExternalDetail />} />
        <Route path='/multi-app/instances' element={<SourceNavigation />} />
        <Route path='/new' element={<ExternalCreate />} />
        <Route path='/multi-app/external-apps' element={<ExternalAppsLayout />}>
          <Route path='new' element={<ExternalCreate />} />
        </Route>
        <Route path='/list' element={<ExternalAppsList />} />
        <Route path='/workbench' element={<Workbench />} />
        <Route
          path='/multi-app/external-apps/:id'
          element={<p>Application saved</p>}
        />
      </Routes>
    </AuthenticationProvider>,
    {
      route: path,
      namespace: metadata.name,
      namespaces: {
        [metadata.name]: enUS,
        '@nocobase/app-plugin-identity-provider': identity,
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
      fetch: answerApi((call) =>
        call.path === 'authorization/permissions'
          ? { data: { unrestricted, permissions: [] } }
          : handler(call),
      ),
    },
  );
}
it('uses the shared route dialog with one fixed footer, a linked submit button and the applications list behind it', async () => {
  await mount('/multi-app/external-apps/new?source=external&q=lab', () => ({
    data: [],
  }));
  const dialog = await screen.findByRole('dialog', { name: enUS.external.add });
  const footer = dialog.querySelector('[data-slot="route-overlay-footer"]');
  const submit = within(dialog).getByRole('button', {
    name: enUS.external.add,
  });
  expect(dialog).toHaveAttribute('data-presentation', 'dialog');
  expect(
    dialog.querySelectorAll('[data-slot="route-overlay-footer"]'),
  ).toHaveLength(1);
  expect(footer).toContainElement(submit);
  expect(footer).toContainElement(
    within(dialog).getByRole('button', { name: enUS.actions.cancel }),
  );
  expect(
    document.getElementById(submit.getAttribute('form') ?? ''),
  ).toContainElement(screen.getByLabelText('Application name *'));
  expect(dialog.querySelector('[data-slot="card"]')).toBeNull();
  expect(
    screen.getByRole('heading', { name: enUS.portal.management, hidden: true }),
  ).toBeInTheDocument();
});

it.each(['cancel', 'close', 'escape'] as const)(
  'returns to the connected-applications tab and preserves filters on %s',
  async (method) => {
    const query = '?source=external&q=lab&page=2';
    await mount('/multi-app/external-apps/new' + query, () => ({ data: [] }));
    const dialog = await screen.findByRole('dialog', {
      name: enUS.external.add,
    });
    if (method === 'escape') await userEvent.keyboard('{Escape}');
    else
      await userEvent.click(
        within(dialog).getByRole('button', {
          name: method === 'cancel' ? enUS.actions.cancel : 'Close',
        }),
      );
    expect(await screen.findByTestId('location')).toHaveTextContent(
      '/multi-app/instances' + query,
    );
    expect(
      await screen.findByRole('tab', { name: enUS.external.title }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
);

it('blocks dismissal and repeat submission while connecting, then keeps the form open on failure', async () => {
  const pending = Promise.withResolvers<unknown>();
  const calls: ApiCall[] = [];
  await mount('/multi-app/external-apps/new?source=external', (call) => {
    if (call.method === 'POST') {
      calls.push(call);
      return pending.promise;
    }
    return { data: [] };
  });
  const dialog = await screen.findByRole('dialog', { name: enUS.external.add });
  await userEvent.type(
    screen.getByLabelText('Application name *'),
    'Research application',
  );
  await userEvent.type(
    screen.getByLabelText('Application URL *'),
    'https://independent.example/lab',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: enUS.external.add }),
  );
  expect(
    await within(dialog).findByRole('button', { name: enUS.external.saving }),
  ).toBeDisabled();
  expect(
    within(dialog).getByRole('button', { name: enUS.actions.cancel }),
  ).toBeDisabled();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  await userEvent.keyboard('{Escape}');
  expect(dialog).toBeVisible();
  expect(calls).toHaveLength(1);
  await act(async () => pending.resolve(new Response(null, { status: 500 })));
  expect(await within(dialog).findByRole('alert')).toBeVisible();
  expect(
    within(dialog).getByRole('button', { name: enUS.external.add }),
  ).toBeEnabled();
  expect(screen.getByLabelText('Application name *')).toHaveValue(
    'Research application',
  );
});

it('keeps conditional callback validation when the submit action is in the dialog footer', async () => {
  const calls: ApiCall[] = [];
  await mount('/new', (call) => {
    calls.push(call);
    return { data: { id: 'external-web' } };
  });
  await userEvent.type(
    screen.getByLabelText('Application name *'),
    'Web application',
  );
  await userEvent.type(
    screen.getByLabelText('Application URL *'),
    'https://web.example/',
  );
  await userEvent.click(
    screen.getByRole('combobox', { name: enUS.external.kind }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: enUS.external.web }),
  );
  await userEvent.click(
    screen.getByRole('combobox', { name: enUS.external.authMode }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: enUS.external.platform }),
  );
  // Wait for the portaled selector to restore focus before starting the next interaction.
  await waitFor(() =>
    expect(
      screen.getByRole('combobox', { name: enUS.external.authMode }),
    ).toHaveFocus(),
  );
  const callback = await screen.findByLabelText('Callback URL *');
  const submit = screen.getByRole('button', { name: enUS.external.add });
  await userEvent.click(submit);
  expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  expect(callback).toBeRequired();
  await userEvent.type(callback, 'https://web.example/oidc/callback');
  expect(callback).toHaveValue('https://web.example/oidc/callback');
  expect(callback.closest('form')?.checkValidity()).toBe(true);
  await userEvent.click(submit);
  expect(screen.queryByRole('alert')?.textContent).toBeUndefined();
  expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  expect(await screen.findByText('Application saved')).toBeVisible();
  expect(calls.find((call) => call.method === 'POST')?.json).toMatchObject({
    kind: 'web',
    authMode: 'platform',
    callbackUrl: 'https://web.example/oidc/callback',
  });
});

it('connects an independent application through the real form and reports the saved result', async () => {
  const calls: ApiCall[] = [];
  await mount('/new', (call) => {
    calls.push(call);
    return { data: { id: 'external-test' } };
  });
  await userEvent.type(
    screen.getByLabelText('Application name *'),
    'Research application',
  );
  await userEvent.type(
    screen.getByLabelText('Application URL *'),
    'https://independent.example/lab',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Connect application' }),
  );
  expect(await screen.findByText('Application saved')).toBeVisible();
  expect(
    calls.filter((call) => call.path === 'multiApp/externalApps'),
  ).toHaveLength(1);
});
it('shows a link-only directory entry without adding a NocoBase login suffix', async () => {
  const url = 'https://docs.example/guide?language=en';
  await mount('/workbench', () => ({
    data: [
      {
        id: 'docs',
        name: 'Documentation',
        url,
        entryUrl: url,
        template: '',
        templateName: '',
      },
    ],
  }));
  expect(
    await screen.findByRole('link', { name: 'Documentation' }),
  ).toHaveAttribute('href', url);
});
it('lists external applications without deployment controls and filters them by name', async () => {
  await mount('/list', () => ({
    data: [
      {
        id: 'external-docs',
        name: 'Documentation',
        url: 'https://docs.example/',
        kind: 'web',
        authMode: 'link',
        status: 'enabled',
        revision: 1,
      },
    ],
  }));
  expect(
    await screen.findByRole('link', { name: 'Documentation' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: /Start|Stop|Upgrade/ }),
  ).not.toBeInTheDocument();
  await userEvent.type(
    screen.getByRole('textbox', { name: enUS.portal.search }),
    'unmatched',
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('link', { name: 'Documentation' }),
    ).not.toBeInTheDocument(),
  );
});

it('keeps source tabs and their panel aligned with deep links, keyboard navigation and browser history', async () => {
  await mount('/multi-app/instances?source=external', () => ({ data: [] }));
  const external = await screen.findByRole('tab', {
    name: enUS.external.title,
  });
  const managed = screen.getByRole('tab', { name: enUS.external.managed });
  expect(external).toHaveAttribute('aria-selected', 'true');
  expect(
    screen.getByRole('tabpanel', { name: enUS.external.title }),
  ).toHaveTextContent('Connected applications list');
  external.focus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(managed).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(managed).toHaveAttribute('aria-selected', 'true');
  expect(
    screen.getByRole('tabpanel', { name: enUS.external.managed }),
  ).toHaveTextContent('Managed applications list');
  await userEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(external).toHaveAttribute('aria-selected', 'true');
  await userEvent.click(managed);
  expect(managed).toHaveAttribute('aria-selected', 'true');
});

it('separates overview, on-demand login configuration and access grants', async () => {
  const calls: ApiCall[] = [];
  await mount('/detail/independent', (call) => {
    calls.push(call);
    if (call.path === 'multiApp/externalApps/independent')
      return {
        data: {
          id: 'independent',
          name: 'Independent laboratory',
          kind: 'nocobase',
          authMode: 'platform',
          status: 'enabled',
          url: 'https://lab.example/reagents',
          revision: 1,
        },
      };
    if (call.path.endsWith('/configureIdentity'))
      return {
        data: {
          variables: { PLATFORM_SSO_CLIENT_SECRET: 'test-client-secret' },
          callbackUrl: 'https://lab.example/callback',
          discoveryUrl: 'https://platform.example/discovery',
        },
      };
    if (call.path.endsWith('/members'))
      return {
        data: [
          {
            userId: 'u1',
            name: 'Lab member',
            username: 'member',
            role: 'reader',
          },
        ],
      };
    return { data: [] };
  });
  expect(
    await screen.findByRole('tabpanel', { name: 'Overview' }),
  ).toHaveTextContent('Independent NocoBase 3');
  expect(screen.getByRole('link', { name: 'Enter' })).toHaveAttribute(
    'href',
    'https://lab.example/reagents/login?auth=platform&redirect=%2F',
  );
  expect(
    screen.queryByRole('button', { name: enUS.agentSetup.view }),
  ).not.toBeInTheDocument();
  expect(
    calls.some(
      (call) =>
        call.path.endsWith('/configureIdentity') ||
        call.path.endsWith('/members'),
    ),
  ).toBe(false);
  await userEvent.click(
    screen.getByRole('tab', { name: 'Login configuration' }),
  );
  expect(
    screen.queryByRole('button', { name: 'Disable connection' }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: enUS.agentSetup.view }),
  );
  expect(
    await screen.findByText(/https:\/\/lab.example\/callback/),
  ).toBeVisible();
  expect(screen.queryByText(/test-client-secret/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Access' }));
  expect(await screen.findByText('Lab member')).toBeVisible();
  expect(screen.getByText(/https:\/\/lab.example\/callback/)).not.toBeVisible();
  await userEvent.click(
    screen.getByRole('tab', { name: 'Login configuration' }),
  );
  expect(
    await screen.findByText(/https:\/\/lab.example\/callback/),
  ).toBeVisible();
  expect(
    calls.filter((call) => call.path.endsWith('/configureIdentity')),
  ).toHaveLength(1);
});
it('omits login configuration for link-only applications and preserves their entry URL', async () => {
  const url = 'https://docs.example/guide?language=en';
  await mount('/detail/docs', (call) =>
    call.path === 'multiApp/externalApps/docs'
      ? {
          data: {
            id: 'docs',
            name: 'Documentation',
            kind: 'web',
            authMode: 'link',
            status: 'enabled',
            url,
            revision: 1,
          },
        }
      : { data: [] },
  );
  await screen.findByRole('tabpanel', { name: 'Overview' });
  expect(screen.getAllByRole('tab')).toHaveLength(2);
  expect(
    screen.queryByRole('tab', { name: 'Login configuration' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Enter' })).toHaveAttribute(
    'href',
    url,
  );
  await userEvent.click(screen.getByRole('tab', { name: 'Access' }));
  expect(screen.getByRole('tabpanel', { name: 'Access' })).toHaveTextContent(
    enUS.external.linkHint,
  );
});

/* eslint-disable react-refresh/only-export-components -- Standalone production fixture entry point, not an HMR component module. */
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Routes } from 'react-router';
import {
  AppClientRoot,
  ClientApplication,
  createAppClientConfig,
  defineAppClientRenderConfig,
} from '@nocobase/app-client';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import {
  defineAppRoutes,
  defineClientPlugins,
} from '@nocobase/app-client/plugins';
import { I18nProvider, NamespaceScope } from '@nocobase/i18n/client';
import mail, {
  MAIL_PLUGIN_NS,
  MailClient,
  MailWorkspacePage,
  mailClientToken,
} from '../../../client/index.js';
import './styles.css';

function Workspace(): React.ReactElement {
  return (
    <MailWorkspacePage
      accountsHref='/mail/accounts'
      headerActions={
        <button
          className='rounded-md border px-4 py-2'
          onClick={(event) => {
            event.currentTarget.textContent = 'Application action completed';
          }}
        >
          Application action
        </button>
      }
    />
  );
}

const runtime = await resolveAppRuntime(
  defineAppRuntime({
    packageName: 'mail-responsive-browser-fixture',
    createAppConfig: createAppClientConfig,
    plugins: defineClientPlugins([mail()]),
    routes: defineAppRoutes([
      {
        name: 'workspace',
        path: '/mail',
        auth: 'required',
        authz: {
          resource: { type: 'page', id: 'mail.workspace' },
          action: 'access',
        },
        componentLoader: async () => ({ default: Workspace }),
      },
    ]),
  }),
);

function FixtureRouter(): React.ReactElement {
  const parameters = new URLSearchParams(window.location.search);
  const constrained = parameters.get('constrained') === 'true';
  return (
    // Deliberately synthetic routing: metadata above is not host authentication/authorization.
    // API interception separately requires an explicit fixture-only access cookie.
    <div className='flex h-screen min-w-0'>
      {constrained ? (
        // Fixed width models space consumed by an application's sidebar, not a theme token.
        <aside
          aria-label='Synthetic application sidebar'
          style={{ width: 640, flexShrink: 0 }}
        >
          Application sidebar
        </aside>
      ) : null}
      <main className='min-h-0 min-w-0 flex-1' data-testid='fixture-content'>
        <NamespaceScope ns={MAIL_PLUGIN_NS}>
          <Suspense fallback={<p>Loading workspace…</p>}>
            <Routes>
              <Route path='/mail' element={<Workspace />} />
              <Route path='*' element={<p>Fixture route not found</p>} />
            </Routes>
          </Suspense>
        </NamespaceScope>
      </main>
    </div>
  );
}

const app = new ClientApplication({
  runtime,
  createRenderConfig: () =>
    defineAppClientRenderConfig({
      basename: runtime.basename,
      reactProviders: [
        ({ children }) => (
          <I18nProvider runtime={runtime.i18n}>{children}</I18nProvider>
        ),
        ...runtime.reactProviders.map((provider) => provider.component),
      ],
      routes: <FixtureRouter />,
    }),
});
runtime.app = app;
await app.start();
Object.assign(window, {
  __mailBrowserFixture: {
    production: import.meta.env.PROD,
    realMailClient: app.services.resolve(mailClientToken) instanceof MailClient,
    host: 'ClientApplication + AppClientRoot',
  },
});
window.addEventListener('pagehide', () => void app.shutdown());
createRoot(document.getElementById('root')!).render(
  <AppClientRoot app={app} />,
);

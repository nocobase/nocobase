/* eslint-disable react-refresh/only-export-components -- Standalone production acceptance entry point. */
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Outlet, Route, Routes } from 'react-router';
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
import authentication, {
  RequiredAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import authorization from '@nocobase/app-plugin-authorization/client';
import { I18nProvider } from '@nocobase/i18n/client';
import mail, {
  MailAccountsPage,
  MailClient,
  MailWorkspacePage,
  mailClientToken,
} from '@nocobase/app-plugin-mail/client';
import { AppThemeProvider } from '../../../../../templates/app-template-default/client/theme/theme-provider.js';
import { renderRouteTree } from '../../../../../templates/app-template-default/client/routing/route-tree.js';
import './styles.css';

function Workspace(): React.ReactElement {
  return <MailWorkspacePage accountsHref='/mail/accounts' />;
}
function Router(): React.ReactElement {
  return (
    <Suspense fallback={<p>Loading page…</p>}>
      <Routes>
        <Route
          path='/login'
          element={<h1>Sign in to the acceptance application</h1>}
        />
        <Route
          element={
            <RequiredAuthentication>
              <Outlet />
            </RequiredAuthentication>
          }
        >
          {/* Use the application's actual ClientRoute lazy-loader and server-backed authorization boundary. */}
          {renderRouteTree(
            runtime.routes.filter(
              (route) =>
                route.path === '/mail' || route.path === '/mail/accounts',
            ),
          )}
        </Route>
        <Route path='*' element={<h1>Acceptance route not found</h1>} />
      </Routes>
    </Suspense>
  );
}
const runtime = await resolveAppRuntime(
  defineAppRuntime({
    packageName: 'mail-production-acceptance',
    createAppConfig: createAppClientConfig,
    plugins: defineClientPlugins([authentication(), authorization(), mail()]),
    routes: defineAppRoutes([
      {
        name: 'accounts',
        path: '/mail/accounts',
        auth: 'required',
        authz: {
          resource: { type: 'page', id: 'mail.workspace' },
          action: 'access',
        },
        componentLoader: async () => ({ default: MailAccountsPage }),
      },
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
const app = new ClientApplication({
  runtime,
  createRenderConfig: () =>
    defineAppClientRenderConfig({
      basename: runtime.basename,
      reactProviders: [
        ({ children }) => (
          <I18nProvider runtime={runtime.i18n}>{children}</I18nProvider>
        ),
        ({ children }) => (
          <AppThemeProvider defaultTheme='light'>{children}</AppThemeProvider>
        ),
        ...runtime.reactProviders.map((provider) => provider.component),
      ],
      routes: <Router />,
    }),
});
runtime.app = app;
await app.start();
Object.assign(window, {
  __mailProductionAcceptance: {
    production: import.meta.env.PROD,
    realMailClient: app.services.resolve(mailClientToken) instanceof MailClient,
    devRoutes: runtime.devRoutes.length,
  },
});
window.addEventListener('pagehide', () => void app.shutdown());
createRoot(document.getElementById('root')!).render(
  <AppClientRoot app={app} />,
);

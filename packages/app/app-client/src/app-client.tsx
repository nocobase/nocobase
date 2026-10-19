import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactElement, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

import { NavigationGuardProvider } from './navigation-guard-provider.js';

import type { ClientApplication } from './application.js';
import { ClientApplicationContext } from './application-context.js';
import { normalizeAppClientBasename } from './config.js';
import { createAppQueryClient } from './query-client.js';

export interface AppClientRootProps {
  readonly app: ClientApplication;
}

export function AppClientRoot({ app }: AppClientRootProps): ReactElement {
  const config = app.renderConfig;

  return (
    <BrowserRouter basename={normalizeAppClientBasename(config.basename)}>
      <AppClientProviders app={app}>{config.routes}</AppClientProviders>
    </BrowserRouter>
  );
}

export interface AppClientProvidersProps {
  readonly app: ClientApplication;
  readonly children?: ReactNode;
}

/**
 * Everything `AppClientRoot` mounts inside its router: the application, its React providers and, innermost, its query
 * cache, around `children` in place of the routes. It needs a router above it. A test renders a page in it under a
 * router of its own, so the page reads the services, translations, toaster and query cache it reads in the running
 * application.
 */
export function AppClientProviders({
  app,
  children,
}: AppClientProvidersProps): ReactElement {
  const reactProviders = app.renderConfig.reactProviders ?? [];
  // The query cache sits where Refine's did, innermost around the routes: pages read it even when a React provider
  // mounts a cache of its own, and the React providers themselves do not see it.
  const content = reactProviders.reduceRight<ReactNode>(
    (inner, ReactProvider) => <ReactProvider>{inner}</ReactProvider>,
    <RoutesQueryClientProvider>{children}</RoutesQueryClientProvider>,
  );

  return (
    <ClientApplicationContext.Provider value={app}>
      <NavigationGuardProvider>{content}</NavigationGuardProvider>
    </ClientApplicationContext.Provider>
  );
}

/**
 * The query cache Refine used to create for the routes: a new one for each mount, with Refine's defaults. A React
 * provider that remounts the routes, as the authorization provider does for each session, therefore gives the pages an
 * empty cache.
 */
function RoutesQueryClientProvider({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const [client] = useState(createAppQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

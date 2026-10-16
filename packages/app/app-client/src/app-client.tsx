import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactElement, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

import { NavigationGuardProvider } from './navigation-guard-provider.js';

import type { ClientApplication } from './application.js';
import { ClientApplicationContext } from './application-context.js';
import { normalizeAppClientBasename } from './config.js';

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
 * Everything `AppClientRoot` mounts inside its router: the application, its query cache and its React providers, around
 * `children` in place of the routes. It needs a router above it. A test renders a page in it under a router of its own,
 * so the page reads the services, translations and toaster it reads in the running application.
 */
export function AppClientProviders({
  app,
  children,
}: AppClientProvidersProps): ReactElement {
  const reactProviders = app.renderConfig.reactProviders ?? [];
  const content = reactProviders.reduceRight<ReactNode>(
    (inner, ReactProvider) => <ReactProvider>{inner}</ReactProvider>,
    children,
  );

  // The query cache sits outside the React providers so that they, and not only the pages, can read it.
  return (
    <ClientApplicationContext.Provider value={app}>
      <NavigationGuardProvider>
        <QueryClientProvider client={app.queryClient}>
          {content}
        </QueryClientProvider>
      </NavigationGuardProvider>
    </ClientApplicationContext.Provider>
  );
}

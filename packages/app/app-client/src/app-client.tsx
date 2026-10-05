import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/react-router';
import { type ReactElement, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router';

import type { ClientApplication } from './application.js';
import { ClientApplicationContext } from './application-context.js';
import { normalizeAppClientBasename } from './config.js';

export interface AppClientRootProps {
  readonly app: ClientApplication;
}

export function AppClientRoot({ app }: AppClientRootProps): ReactElement {
  const config = app.renderConfig;
  const refine = app.refineConfig;
  const configuredChildren =
    refine.children === undefined ? config.routes : refine.children;

  return (
    <BrowserRouter basename={normalizeAppClientBasename(config.basename)}>
      <AppClientProviders app={app}>{configuredChildren}</AppClientProviders>
    </BrowserRouter>
  );
}

export interface AppClientProvidersProps {
  readonly app: ClientApplication;
  readonly children?: ReactNode;
}

/**
 * Everything `AppClientRoot` mounts inside its router: the application, its React providers and Refine, around
 * `children` in place of the routes. It needs a router above it. A test renders a page in it under a router of its own,
 * so the page reads the services, translations and toaster it reads in the running application.
 */
export function AppClientProviders({
  app,
  children,
}: AppClientProvidersProps): ReactElement {
  const config = app.renderConfig;
  const refine = app.refineConfig;
  const configuredRouterProvider = refine.routerProvider ?? routerProvider;
  const reactProviders = config.reactProviders ?? [];
  const content = reactProviders.reduceRight<ReactNode>(
    (inner, ReactProvider) => <ReactProvider>{inner}</ReactProvider>,
    <Refine
      {...refine}
      routerProvider={configuredRouterProvider}
      options={{
        syncWithLocation: true,
        disableTelemetry: true,
        ...refine.options,
      }}
    >
      {children}
    </Refine>,
  );

  return (
    <ClientApplicationContext.Provider value={app}>
      {content}
    </ClientApplicationContext.Provider>
  );
}

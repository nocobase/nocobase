import {
  defineAppRoutes,
  type AppClientAppRoutesContribution,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { Layers, Settings } from 'lucide-react';

export interface FoundationRouteOptions {
  /** Wrap the entry in a settings group for a bare application. */
  readonly settingsGroup?: boolean;
  /** App-relative path of the page. Defaults to `/foundation`. */
  readonly path?: string;
  /** `false` keeps the page out of the menu, for an application that links to it from elsewhere. Defaults to `true`. */
  readonly navigation?: boolean;
}

/**
 * The App Foundation page. `unrestricted` admits only identities with unrestricted access, such as holders of the root
 * Permission Set, and is never offered as a grant: the same boundary the overview route enforces on the server.
 */
export function foundationDefinition(
  options: FoundationRouteOptions = {},
): AppClientRoutePageDefinition {
  return {
    name: 'foundation',
    path: normalizePath(options.path ?? '/foundation'),
    auth: 'required',
    authz: 'unrestricted',
    ...(options.navigation === false
      ? {}
      : { navigation: { title: 'nav.foundation', icon: Layers, order: 1000 } }),
    componentLoader: async () => {
      const { FoundationPage } =
        await import('./components/foundation-page.js');
      return { default: FoundationPage };
    },
  };
}

export function createFoundationRoutes(
  options: FoundationRouteOptions = {},
): AppClientAppRoutesContribution {
  return defineAppRoutes(
    options.settingsGroup
      ? [
          {
            name: 'foundationSettings',
            navigation: { title: 'nav.settings', icon: Settings, order: 100 },
            children: [foundationDefinition(options)],
          },
        ]
      : [foundationDefinition(options)],
  );
}

function normalizePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed)
    throw new TypeError('The App Foundation path must contain a path segment');
  return `/${trimmed}`;
}

const routes: AppClientAppRoutesContribution = createFoundationRoutes();

export default routes;

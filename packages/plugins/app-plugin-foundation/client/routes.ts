import {
  defineAppRoutes,
  type AppClientAppRoutesContribution,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { Compass, Layers, Settings } from 'lucide-react';

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
      : {
          navigation: {
            title: 'nav.foundation',
            description: 'nav.foundationDescription',
            icon: Layers,
            order: 1000,
          },
        }),
    componentLoader: async () => {
      const { FoundationPage } =
        await import('./components/foundation-page.js');
      return { default: FoundationPage };
    },
  };
}

/**
 * Mockup of the capability guide: a static page every signed-in user can open, listing the built-in capabilities with
 * prompts to copy. It loads nothing from the server.
 */
export function capabilityGuideDefinitions(): AppClientRoutePageDefinition[] {
  return [
    {
      name: 'capabilityGuide',
      path: '/capabilities',
      auth: 'required',
      authz: 'skip',
      navigation: {
        title: 'nav.capabilityGuide',
        description: 'nav.capabilityGuideDescription',
        icon: Compass,
        order: 10,
      },
      componentLoader: () => import('./capability-guide/guide-page.js'),
    },
    {
      name: 'capabilityGuideDetail',
      path: '/capabilities/:capabilityId',
      auth: 'required',
      authz: 'skip',
      componentLoader: () => import('./capability-guide/detail-page.js'),
    },
  ];
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
          ...capabilityGuideDefinitions(),
        ]
      : [foundationDefinition(options), ...capabilityGuideDefinitions()],
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

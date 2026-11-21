import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_ROUTE_PATH,
  type AppClientSystemSettingsRoutesContribution,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { Layers, Settings } from 'lucide-react';
import { builtInDetailLoaders } from './capability-guide/details/feature-overview-loaders.js';
import { CAPABILITY_GUIDE_ACCESS } from './access.js';
import { createElement, lazy, type ComponentType } from 'react';

import {
  CAPABILITY_GUIDE_PATH,
  createCapabilityCatalog,
  type CapabilityCatalog,
  type DependencyManifest,
} from '../shared/capability-guide/index.js';

export interface FoundationRouteOptions {
  /**
   * The settings category to join, such as `SYSTEM_SETTINGS_CATEGORIES.system`, or true to declare a standalone Foundation
   * category. Defaults to the built-in System category.
   */
  readonly settingsGroup?: boolean | string;
  /** Overview path, optionally including the settings prefix. Defaults to `/foundation`. */
  readonly path?: string;
  /** `false` keeps the page out of the menu, for an application that links to it from elsewhere. Defaults to `true`. */
  readonly navigation?: boolean;
  /**
   * The application's own `package.json`. Given, the capability guide is registered and lists what it declares.
   */
  readonly manifest?: DependencyManifest;
  /** `false` keeps the guide out of the menu. Defaults to `true`. */
  readonly guideNavigation?: boolean;
  /** Optional host settings home to include in the catalog breadcrumb. */
  readonly guideSettingsPath?: string;
  /** Optional overrides for the plugin-owned detail bodies, loaded only when their entry is opened. */
  readonly guideEntryLoaders?: Readonly<
    Record<string, () => Promise<{ default: ComponentType }>>
  >;
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
 * The capability guide: a static page listing every core module and plugin the application depends on, with business
 * descriptions. The catalog and every detail require the same page-access grant. Plugin-owned detail bodies enforce their data access
 * through the APIs they use; the catalog itself does not grant access to configuration.
 * Both paths render the same page: the list alone on a narrow screen, the list beside the entry on a wide one.
 */
export function capabilityGuideDefinitions(
  catalog: CapabilityCatalog,
  options: {
    readonly navigation?: boolean;
    readonly settingsPath?: string;
    readonly entryLoaders?: FoundationRouteOptions['guideEntryLoaders'];
  } = {},
): AppClientRoutePageDefinition[] {
  const entryComponents = Object.fromEntries(
    Object.entries({ ...builtInDetailLoaders, ...options.entryLoaders }).map(
      ([id, loader]) => [id, lazy(loader)],
    ),
  );
  const componentLoader = async () => {
    const [{ CapabilityGuidePage }, { GuideRuntimeProvider }] =
      await Promise.all([
        import('./capability-guide/guide-page.js'),
        import('./capability-guide/details/runtime-provider.js'),
      ]);
    return {
      default: function CapabilityGuideRoute() {
        return createElement(
          GuideRuntimeProvider,
          null,
          createElement(CapabilityGuidePage, {
            catalog,
            settingsPath: options.settingsPath,
            entryComponents,
          }),
        );
      },
    };
  };
  return [
    {
      name: 'capabilityGuide',
      path: CAPABILITY_GUIDE_PATH,
      auth: 'required',
      authz: CAPABILITY_GUIDE_ACCESS,
      ...(options.navigation === false
        ? {}
        : {
            navigation: {
              title: 'nav.capabilityGuide',
              description: 'nav.capabilityGuideDescription',
              icon: Layers,
              order: 10,
            },
          }),
      componentLoader,
    },
    {
      name: 'capabilityGuideEntry',
      path: `${CAPABILITY_GUIDE_PATH}/:entryId`,
      auth: 'required',
      authz: CAPABILITY_GUIDE_ACCESS,
      componentLoader,
    },
  ];
}

export function createFoundationRoutes(
  options: FoundationRouteOptions = {},
): AppClientSystemSettingsRoutesContribution {
  // Without the application's manifest there is nothing to list: an application that has not opted in keeps exactly
  // the App usage page it had.
  const guide = options.manifest
    ? capabilityGuideDefinitions(createCapabilityCatalog(options.manifest), {
        navigation: options.guideNavigation,
        settingsPath: options.guideSettingsPath,
        entryLoaders: options.guideEntryLoaders,
      })
    : [];
  const standalone = options.settingsGroup === true;
  const parent =
    typeof options.settingsGroup === 'string'
      ? options.settingsGroup
      : standalone
        ? undefined
        : SYSTEM_SETTINGS_CATEGORIES.system;
  const pages = [foundationDefinition(options), ...guide].map((route) => ({
    ...route,
    parent,
    path: route.path.startsWith(SYSTEM_SETTINGS_ROUTE_PATH + '/')
      ? route.path.slice(SYSTEM_SETTINGS_ROUTE_PATH.length)
      : route.path,
  }));
  return defineSystemSettingsRoutes(
    standalone
      ? [
          {
            name: 'foundationSettings',
            category: true,
            navigation: { title: 'nav.settings', icon: Settings, order: 100 },
            children: pages,
          },
        ]
      : pages,
  );
}

function normalizePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed)
    throw new TypeError('The App Foundation path must contain a path segment');
  return `/${trimmed}`;
}

const routes: AppClientSystemSettingsRoutesContribution =
  createFoundationRoutes();

export default routes;

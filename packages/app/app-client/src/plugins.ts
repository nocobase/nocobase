import type { LocalesContribution } from '@nocobase/i18n';
import type { ServiceProviderLifecycle } from '@nocobase/service-provider';
import type { ComponentType } from 'react';

import type { ClientApplication } from './application.js';
import type { AppClientReactProvider } from './config.js';
import {
  defineHeaderActions,
  type AppClientBadgeHook,
  type AppClientHeaderActionDefinition,
  type AppClientHeaderActions,
} from './header-actions.js';
import {
  defineLayoutExtensions,
  type AppClientLayoutExtensionDefinition,
  type AppClientLayoutExtensions,
} from './layout-extensions.js';
import { APP_CLIENT_NAMESPACE } from './namespace.js';

const CONTRIBUTION_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;
const RESERVED_APPLICATION_ROUTE_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

export type AppClientRouteAuth = 'required' | 'guest' | 'optional';

/**
 * Authorization checked before this page loads. `skip` opts out and does not
 * bypass parent guards; `unrestricted` admits only identities with unrestricted
 * access, such as root, and is never offered as a grant. A page that omits it
 * inherits its nearest ancestor page's value; the first page on a path defaults
 * to `unrestricted` on protected pages and to `skip` on guest and optional pages.
 */
export type AppClientRouteAuthz =
  | 'skip'
  | 'unrestricted'
  | {
      readonly resource: { readonly type: string; readonly id: string };
      readonly action: string;
    };

export type AppClientContributionSource = 'application' | 'plugin';

/**
 * Where a route lives. `app` holds the application's own pages, declared with `defineAppRoutes()`. `systemSettings`
 * holds the pages that configure the whole application, declared with `defineSystemSettingsRoutes()` and mounted
 * under `SYSTEM_SETTINGS_ROUTE_PATH`. `personalSettings` holds the pages where each signed-in person configures their
 * own account, declared with `definePersonalSettingsRoutes()` and mounted under `PERSONAL_SETTINGS_ROUTE_PATH`. An
 * application shows each settings surface in a navigation of its own. All share one route tree, authorization,
 * breadcrumbs and component loading.
 */
export type AppClientRouteSurface = 'app' | AppClientSettingsRouteSurface;

/** The two settings surfaces. */
export type AppClientSettingsRouteSurface =
  'systemSettings' | 'personalSettings';

/** The path every system settings page is mounted under. */
export const SYSTEM_SETTINGS_ROUTE_PATH = '/settings';

/** The path every personal settings page is mounted under. */
export const PERSONAL_SETTINGS_ROUTE_PATH = '/me';

/**
 * The system settings categories every application has. A page joins one with `parent`, such as
 * `parent: SYSTEM_SETTINGS_CATEGORIES.ai`. The ids are a contract between plugins and applications and never change;
 * an application renames, reorders or hides a category with `defineSettingsCategories()`, and a plugin that needs
 * another declares its own with `category: true`. `other` comes last and also holds every page whose category does
 * not exist or is hidden.
 */
export const SYSTEM_SETTINGS_CATEGORIES: {
  readonly account: 'account';
  readonly automation: 'automation';
  readonly messages: 'messages';
  readonly ai: 'ai';
  readonly data: 'data';
  readonly system: 'system';
  readonly other: 'other';
} = Object.freeze({
  /** Who can sign in and what they may do: users, authentication, roles and permissions, API keys. */
  account: 'account',
  /** What runs without anyone clicking: workflows, approvals, scheduled jobs. */
  automation: 'automation',
  /** Messages sent and received: notifications, mailboxes. */
  messages: 'messages',
  /** Agents and what they use: agents, runners, skills, models, usage, knowledge. */
  ai: 'ai',
  /** What the application stores: databases, files. */
  data: 'data',
  /** The application's own configuration and runtime: plugins, languages, configuration, cluster, logs, deployment. */
  system: 'system',
  /** Pages that fit no other category. */
  other: 'other',
} as const);

/** The personal settings categories every application has, used like `SYSTEM_SETTINGS_CATEGORIES`. */
export const PERSONAL_SETTINGS_CATEGORIES: {
  readonly account: 'account';
  readonly integrations: 'integrations';
  /** @deprecated Use account. */
  readonly preferences: 'account';
  /** @deprecated Use account. */
  readonly messages: 'account';
  /** @deprecated Use account. */
  readonly other: 'account';
} = Object.freeze({
  account: 'account',
  integrations: 'integrations',
  preferences: 'account',
  messages: 'account',
  other: 'account',
} as const);

export type SystemSettingsCategory =
  (typeof SYSTEM_SETTINGS_CATEGORIES)[keyof typeof SYSTEM_SETTINGS_CATEGORIES];
export type PersonalSettingsCategory =
  (typeof PERSONAL_SETTINGS_CATEGORIES)[keyof typeof PERSONAL_SETTINGS_CATEGORIES];

/** The category that holds pages whose category does not exist or is hidden, in both settings surfaces. */
const FALLBACK_SETTINGS_CATEGORY = {
  systemSettings: 'other',
  personalSettings: 'account',
} as const;

/** Built-in categories in menu order; orders are 100 apart so a plugin category fits between two. */
const BUILT_IN_SETTINGS_CATEGORIES: Readonly<
  Record<
    'systemSettings' | 'personalSettings',
    readonly (readonly [string, number])[]
  >
> = Object.freeze({
  systemSettings: Object.freeze([
    [SYSTEM_SETTINGS_CATEGORIES.account, 100],
    [SYSTEM_SETTINGS_CATEGORIES.automation, 200],
    [SYSTEM_SETTINGS_CATEGORIES.messages, 300],
    [SYSTEM_SETTINGS_CATEGORIES.ai, 400],
    [SYSTEM_SETTINGS_CATEGORIES.data, 500],
    [SYSTEM_SETTINGS_CATEGORIES.system, 600],
    [SYSTEM_SETTINGS_CATEGORIES.other, 900],
  ] as const),
  personalSettings: Object.freeze([
    [PERSONAL_SETTINGS_CATEGORIES.account, 100],
    [PERSONAL_SETTINGS_CATEGORIES.integrations, 200],
  ] as const),
});

interface SettingsSurfaceSpec {
  readonly path: string;
  readonly define: string;
  readonly label: string;
  /**
   * Settings categories share one namespace per surface across packages. The prefix keeps them apart from
   * package-scoped groups, whose ids start with a package name, and from the other surface's categories.
   */
  readonly categoryPrefix: string;
  /**
   * Where a built-in category's title lives: `<titlePrefix><id>` in app-client's namespace (`APP_CLIENT_NAMESPACE`),
   * which ships the English and Chinese defaults. Its route is named `<surface>.<id>`; an application rewords it with
   * a title of its own through `defineSettingsCategories()`.
   */
  readonly titlePrefix: string;
}

const SETTINGS_SURFACES: Readonly<
  Record<AppClientSettingsRouteSurface, SettingsSurfaceSpec>
> = Object.freeze({
  systemSettings: Object.freeze({
    path: SYSTEM_SETTINGS_ROUTE_PATH,
    define: 'defineSystemSettingsRoutes()',
    label: 'system settings',
    categoryPrefix: 'system-settings:',
    titlePrefix: 'settings.categories.',
  }),
  personalSettings: Object.freeze({
    path: PERSONAL_SETTINGS_ROUTE_PATH,
    define: 'definePersonalSettingsRoutes()',
    label: 'personal settings',
    categoryPrefix: 'personal-settings:',
    titlePrefix: 'settings.personal.categories.',
  }),
});

function isSettingsSurface(
  surface: unknown,
): surface is AppClientSettingsRouteSurface {
  return surface === 'systemSettings' || surface === 'personalSettings';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function defineFunctionOf(surface: AppClientRouteSurface): string {
  return surface === 'app'
    ? 'defineAppRoutes()'
    : SETTINGS_SURFACES[surface].define;
}

export type AppClientReactProviderLayer = 'root' | 'application' | 'extension';

export interface AppClientRouteComponentModule {
  default: ComponentType;
}

export type AppClientRouteComponentLoader =
  () => Promise<AppClientRouteComponentModule>;

/**
 * How a page presents itself, declared so the application can build that container before the page module, its
 * authorization check or its data arrive: a `content` page fills the content area, a `child-page` covers the page that
 * opened it, and a `dialog` or `drawer` is a modal overlay. Waiting, denial and load failures then render inside that
 * container instead of where the page's outlet happens to sit.
 *
 * Omitting it keeps the earlier contract: the component builds its own container once it has loaded, and the
 * application only renders a page-sized placeholder until then. Nothing infers a presentation from the route depth.
 */
export type AppClientRoutePresentationKind =
  'content' | 'child-page' | 'dialog' | 'drawer';

export interface AppClientRoutePresentation {
  readonly kind: AppClientRoutePresentationKind;
  /**
   * The overlay's title while the page is not ready, as a static translation key in the route's package. Required
   * for `dialog` and `drawer`, rejected otherwise. It must not depend on the record the page shows.
   */
  readonly title?: string;
  /**
   * The translation namespace of `title`. Defaults to the package that registers the route; a plugin whose route
   * definitions an application registers under its own package names its own package here.
   */
  readonly namespace?: string;
}

export interface AppClientRoutePageDefinition {
  /**
   * Group name in this package, or packageName:name for another package; contribution roots only. In
   * `defineSystemSettingsRoutes()` and `definePersonalSettingsRoutes()` a bare name names a settings category instead: a
   * group declared at the root of any contribution of the same settings surface, whichever package declared it.
   */
  readonly parent?: string;
  readonly name: string;
  readonly path: string;
  readonly auth?: AppClientRouteAuth;
  /** Omitted: inherited from the nearest ancestor page, else an auth-based default. Declare it on the first page. */
  readonly authz?: AppClientRouteAuthz;
  readonly breadcrumb?: AppClientRouteBreadcrumb;
  readonly navigation?: AppClientRouteNavigation;
  readonly presentation?: AppClientRoutePresentation;
  readonly componentLoader: AppClientRouteComponentLoader;
  readonly children?: readonly AppClientRouteDefinition[];
}

export interface AppClientRouteGroupDefinition {
  /** As on a page: a group in this package, packageName:name, or in a settings contribution a settings category. */
  readonly parent?: string;
  readonly name: string;
  readonly path?: string;
  readonly auth?: AppClientRouteAuth;
  readonly breadcrumb?: AppClientRouteBreadcrumb;
  readonly navigation: AppClientRouteNavigation;
  readonly children: readonly AppClientRouteDefinition[];
  readonly componentLoader?: never;
  readonly presentation?: never;
  /**
   * Settings contributions only: declares a new settings category, at the root and without `parent`. Its name is the
   * category id pages name in `parent`; it must not repeat a built-in or another package's category.
   */
  readonly category?: true;
  /**
   * Settings contributions only: a module, one menu entry whose pages are its tabs. Every settings group that is not a
   * category declares it.
   */
  readonly kind?: 'module';
}

export type AppClientRouteDefinition =
  AppClientRoutePageDefinition | AppClientRouteGroupDefinition;

export interface AppClientRegisteredRoute {
  readonly name: string;
  readonly path: string;
  readonly auth: AppClientRouteAuth;
  readonly authz: AppClientRouteAuthz;
  readonly breadcrumb?: AppClientRouteBreadcrumb;
  readonly navigation?: AppClientRouteNavigation;
  readonly presentation?: AppClientRoutePresentation;
  readonly componentLoader?: AppClientRouteComponentLoader;
  readonly children?: readonly AppClientRegisteredRoute[];
  readonly id: string;
  readonly packageName: string;
  readonly source: AppClientContributionSource;
  /** The settings surface of every route declared with a settings define function; omitted on application routes. */
  readonly surface?: AppClientRouteSurface;
  /** A settings group's role: a `category` of the settings menu, or a `module` whose pages are tabs. */
  readonly kind?: 'category' | 'module';
  /** The id of a settings category, set on category groups: the name pages give in `parent`. */
  readonly category?: string;
}

/**
 * An icon component for a navigation entry. It takes a `className` so the application controls sizing rather than the
 * plugin, which is what keeps icons consistent across plugins. A lucide-react icon satisfies this directly.
 */
export type AppClientRouteIcon = ComponentType<{
  readonly className?: string;
}>;

/**
 * How the menu orders sibling routes: by `navigation.order`, lower first,
 * defaulting to 0. Use it with a stable sort so ties keep registration order.
 */
export function compareNavigationOrder(
  left: { readonly navigation?: { readonly order?: number } },
  right: { readonly navigation?: { readonly order?: number } },
): number {
  return (left.navigation?.order ?? 0) - (right.navigation?.order ?? 0);
}

/** Navigation metadata of a route: declaring it puts the route in the application's menu. */
export interface AppClientRouteNavigation {
  /** Lower values appear first among siblings; defaults to 0, with ties in registration order. */
  readonly order?: number;
  readonly title: string;
  /**
   * One sentence saying what the entry is for, as a translation key like `title`. Menus ignore it; an overview such
   * as a settings home shows it under the title.
   */
  readonly description?: string;
  readonly icon?: AppClientRouteIcon;
  /** Additional settings resource IDs editable alongside this module’s route permissions in the role editor. */
  readonly relatedSettings?: readonly string[];
  /**
   * The count beside the entry, such as unread messages: a hook the menu calls while it renders the entry
   * (`AppClientBadgeHook`). A layout may still pass a count of its own for the entry, which wins.
   */
  readonly badge?: AppClientBadgeHook;
}

/**
 * How a route names itself in a breadcrumb trail.
 *
 * It works the way `navigation` does: declaring it puts the route in the trail, leaving it out keeps the route out.
 * The two are independent — a page can appear in a menu, in a trail, in both, or in neither — so neither falls back
 * to the other and a route that belongs in both states its title twice.
 *
 * Unlike `navigation` it is allowed on a parameterised path, since a trail names the kind of page rather than the
 * record it shows: `/orders/:orderId` is "Order detail", not "Order #42".
 */
export interface AppClientRouteBreadcrumb {
  readonly title: string;
}

export interface AppClientAppRoutesContribution {
  readonly parent: 'app';
  readonly routes: readonly AppClientRouteDefinition[];
}

export interface AppClientSystemSettingsRoutesContribution {
  readonly parent: 'systemSettings';
  readonly routes: readonly AppClientRouteDefinition[];
  /** Set by `defineSettingsCategories()`: how the application shows existing categories. */
  readonly categories?: AppClientSettingsCategoryOverrides;
}

export interface AppClientPersonalSettingsRoutesContribution {
  readonly parent: 'personalSettings';
  readonly routes: readonly AppClientRouteDefinition[];
  /** Set by `defineSettingsCategories()`: how the application shows existing categories. */
  readonly categories?: AppClientSettingsCategoryOverrides;
}

/** How an application shows one existing settings category; the category keeps its id. */
export interface AppClientSettingsCategoryOverride {
  /** A translation key replacing the category's title, read where the category's own title is: the application's namespace for a built-in category. */
  readonly title?: string;
  readonly order?: number;
  /** Leaves the category out of the menu; its pages move to the surface's fallback category. */
  readonly hidden?: boolean;
}

export type AppClientSettingsCategoryOverrides = Readonly<
  Record<string, AppClientSettingsCategoryOverride>
>;

export type AppClientRouteContribution =
  | AppClientAppRoutesContribution
  | AppClientSystemSettingsRoutesContribution
  | AppClientPersonalSettingsRoutesContribution;

export interface AppClientRouteComponentOverrideDefinition {
  readonly routeId: string;
  readonly componentLoader: AppClientRouteComponentLoader;
  readonly componentEntry?: string;
  /**
   * The replacement component's presentation. An override never inherits the route's: one that omits it builds its
   * own container, as overrides did before presentations existed, so an older override is not wrapped in a second one.
   */
  readonly presentation?: AppClientRoutePresentation;
}

export interface AppClientSourceExtension {
  readonly name: string;
  readonly routeComponentOverrides?: readonly AppClientRouteComponentOverrideDefinition[];
}

export interface AppClientReactProviderDefinition {
  readonly name: string;
  readonly component: AppClientReactProvider;
  readonly layer?: AppClientReactProviderLayer;
  readonly before?: readonly string[];
  readonly after?: readonly string[];
}

export interface AppClientRegisteredReactProvider extends AppClientReactProviderDefinition {
  readonly id: string;
  readonly layer: AppClientReactProviderLayer;
  readonly packageName: string;
  readonly source: AppClientContributionSource;
}

export interface ClientServiceProviderContext<TOptions = unknown> {
  readonly packageName: string;
  readonly source: AppClientContributionSource;
  readonly options: TOptions;
}

export type ClientServiceProviderConstructor<TOptions = unknown> = new (
  app: ClientApplication,
  context: ClientServiceProviderContext<TOptions>,
) => ServiceProviderLifecycle;

export interface AppClientRegisteredServiceProvider {
  readonly Provider: ClientServiceProviderConstructor;
  readonly context: ClientServiceProviderContext;
}

export type AppClientRoutes<TOptions = void> =
  | AppClientRouteContribution
  | readonly AppClientRouteContribution[]
  | ((
      options: TOptions,
    ) => AppClientRouteContribution | readonly AppClientRouteContribution[]);

export type AppClientReactProviders<TOptions = void> =
  | readonly AppClientReactProviderDefinition[]
  | ((options: TOptions) => readonly AppClientReactProviderDefinition[]);

export type AppClientServiceProviders<TOptions = void> =
  | readonly ClientServiceProviderConstructor<TOptions>[]
  | ((
      options: TOptions,
    ) => readonly ClientServiceProviderConstructor<TOptions>[]);

export type AppClientLocales = LocalesContribution;

export interface AppClientContribution<TOptions = void> {
  readonly packageName: string;
  readonly serviceProviders?: AppClientServiceProviders<TOptions>;
  readonly reactProviders?: AppClientReactProviders<TOptions>;
  readonly routes?: AppClientRoutes<TOptions>;
  readonly locales?: AppClientLocales;
  /** Buttons in the header's right-hand area, left of the account menu (`AppClientHeaderActionDefinition`). */
  readonly headerActions?: AppClientHeaderActions<TOptions>;
  /** A provider around the signed-in layout and an aside beside its content (`AppClientLayoutExtensionDefinition`). */
  readonly layoutExtensions?: AppClientLayoutExtensions<TOptions>;
  readonly options?: TOptions;
}

export interface AppClientContributions {
  readonly packageName: string;
  readonly source?: AppClientContributionSource;
  readonly routes?:
    AppClientRouteContribution | readonly AppClientRouteContribution[];
  readonly reactProviders?: readonly AppClientReactProviderDefinition[];
}

export type AppClientPluginContributions = AppClientContributions;

export interface ResolveAppClientContributionsOptions {
  readonly systemSettingsRoutes?: boolean;
  readonly personalSettingsRoutes?: boolean;
  readonly excludedRouteIds?: readonly string[];
}

export interface ResolvedAppClientContributions {
  readonly excludedRoutes?: ReadonlyMap<string, 'page' | 'group'>;
  readonly routes: readonly AppClientRegisteredRoute[];
  readonly reactProviders: readonly AppClientRegisteredReactProvider[];
}

export interface AppClientPluginDefinition<
  TOptions,
> extends AppClientContribution<TOptions> {
  /** Maps options to route component overrides. Return an empty array for none. */
  readonly routeComponentOverrides?: (
    options: TOptions,
  ) => readonly AppClientRouteComponentOverrideDefinition[];
}

export interface AppClientPluginRegistration {
  readonly packageName: string;
  readonly serviceProviders: readonly ClientServiceProviderConstructor[];
  readonly routes: readonly AppClientRouteContribution[];
  readonly reactProviders: readonly AppClientReactProviderDefinition[];
  readonly locales?: AppClientLocales;
  readonly headerActions: readonly AppClientHeaderActionDefinition[];
  readonly layoutExtensions: readonly AppClientLayoutExtensionDefinition[];
  readonly routeComponentOverrides: readonly AppClientRouteComponentOverrideDefinition[];
  readonly options: unknown;
}

export type AppClientPluginFactory<TOptions = void> = (
  options?: TOptions,
) => AppClientPluginRegistration;

export interface AppClientPlugins {
  readonly plugins: readonly AppClientPluginRegistration[];
  readonly routeComponentOverrides: readonly AppClientRouteComponentOverrideDefinition[];
}

/**
 * Wraps a plugin's client entries into a registration factory the application
 * calls in its `client/plugins.ts`.
 *
 * Contribution declarations are static. Route components and locale messages
 * remain lazy at their leaf loaders.
 */
export function defineClientPlugin<TOptions = void>(
  definition: AppClientPluginDefinition<TOptions>,
): AppClientPluginFactory<TOptions> {
  const packageName = normalizePackageName(definition.packageName);

  return (options?: TOptions): AppClientPluginRegistration => {
    const resolvedOptions = (options ?? {}) as TOptions;
    const overrides = definition.routeComponentOverrides
      ? definition.routeComponentOverrides(resolvedOptions)
      : [];

    return Object.freeze({
      packageName,
      serviceProviders: Object.freeze(
        resolveServiceProviders(definition.serviceProviders, resolvedOptions),
      ),
      routes: Object.freeze(
        normalizeRouteContributions(
          resolveContribution(definition.routes, resolvedOptions),
        ),
      ),
      reactProviders: defineClientReactProviders(
        resolveContribution(definition.reactProviders, resolvedOptions) ?? [],
      ),
      locales: definition.locales,
      headerActions: defineHeaderActions(
        resolveContribution(definition.headerActions, resolvedOptions) ?? [],
      ),
      layoutExtensions: defineLayoutExtensions(
        resolveContribution(definition.layoutExtensions, resolvedOptions) ?? [],
      ),
      routeComponentOverrides: defineClientRouteComponentOverrides(overrides),
      options: resolvedOptions,
    });
  };
}

/**
 * Collects the application's registered plugins in declaration order.
 */
export function defineClientPlugins(
  registrations: readonly AppClientPluginRegistration[],
): AppClientPlugins {
  const seen = new Set<string>();
  const plugins: AppClientPluginRegistration[] = [];
  const routeComponentOverrides: AppClientRouteComponentOverrideDefinition[] =
    [];

  for (const plugin of registrations) {
    if (seen.has(plugin.packageName)) {
      throw new Error(
        `Client plugin "${plugin.packageName}" is registered more than once.`,
      );
    }
    seen.add(plugin.packageName);

    plugins.push(plugin);
    routeComponentOverrides.push(...plugin.routeComponentOverrides);
  }

  return Object.freeze({
    plugins: Object.freeze(plugins),
    routeComponentOverrides: Object.freeze(routeComponentOverrides),
  });
}

function resolveContribution<TOptions, TResult>(
  contribution: TResult | ((options: TOptions) => TResult) | undefined,
  options: TOptions,
): TResult | undefined {
  return typeof contribution === 'function'
    ? (contribution as (value: TOptions) => TResult)(options)
    : contribution;
}

function resolveServiceProviders<TOptions>(
  contribution: AppClientServiceProviders<TOptions> | undefined,
  options: TOptions,
): readonly ClientServiceProviderConstructor[] {
  const providers = resolveContribution(contribution, options) ?? [];
  return providers as readonly ClientServiceProviderConstructor[];
}

export function defineAppRoutes(
  routes: readonly AppClientRouteDefinition[],
): AppClientAppRoutesContribution {
  return Object.freeze({
    parent: 'app',
    routes: freezeNavigationRoutes(routes),
  });
}

/**
 * Declares system settings pages, where administrators configure the whole application: the same definitions as
 * `defineAppRoutes()`, mounted under `/settings` and marked with the `systemSettings` surface, mainly so a plugin can
 * contribute its configuration pages without knowing how the application arranges them. A page that declares no
 * `authz` is open only to unrestricted identities, so declare one to let other roles in.
 *
 * A group declared at the root of a settings contribution is a category, shared by every package of the same surface:
 * a page or group names it with a bare `parent`, such as `parent: 'system'`, and the application declares the
 * categories it offers. A category's path, when it has one, is part of its pages' paths; the usual categories declare
 * none, so moving a page between categories keeps its URL. `packageName:name` still names a group of one package, such
 * as a module whose pages are tabs. Routes of one surface cannot nest under a group of another.
 */
export function defineSystemSettingsRoutes(
  routes: readonly AppClientRouteDefinition[],
): AppClientSystemSettingsRoutesContribution {
  return Object.freeze({
    parent: 'systemSettings',
    routes: freezeNavigationRoutes(routes),
  });
}

/**
 * Declares personal settings pages, where each signed-in person configures their own account: the same definitions
 * and category rules as `defineSystemSettingsRoutes()`, mounted under `/me` and marked with the `personalSettings`
 * surface. A page that declares neither `auth` nor `authz` is open to every signed-in person (`auth: 'required'`,
 * `authz: 'skip'`), so it stays out of role permissions; its data belongs to the current person, whom the server takes
 * from the session.
 */
export function definePersonalSettingsRoutes(
  routes: readonly AppClientRouteDefinition[],
): AppClientPersonalSettingsRoutesContribution {
  return Object.freeze({
    parent: 'personalSettings',
    routes: freezeNavigationRoutes(routes),
  });
}

/**
 * Changes how the application shows existing settings categories, built-in or declared by a plugin: their title,
 * their order, or whether they are shown at all. A hidden category's pages move to the surface's fallback category. Ids never change and
 * categories are never removed, so plugins can rely on them. Only the application may register it; an override naming
 * a category nobody declares is ignored with a development warning.
 */
export function defineSettingsCategories(
  surface: 'systemSettings',
  categories: AppClientSettingsCategoryOverrides,
): AppClientSystemSettingsRoutesContribution;
export function defineSettingsCategories(
  surface: 'personalSettings',
  categories: AppClientSettingsCategoryOverrides,
): AppClientPersonalSettingsRoutesContribution;
export function defineSettingsCategories(
  surface: AppClientSettingsRouteSurface,
  categories: AppClientSettingsCategoryOverrides,
):
  | AppClientSystemSettingsRoutesContribution
  | AppClientPersonalSettingsRoutesContribution {
  if (!isSettingsSurface(surface))
    throw new Error(
      `defineSettingsCategories() takes "systemSettings" or "personalSettings", not "${String(surface)}".`,
    );
  const frozen = Object.freeze(
    Object.fromEntries(
      Object.entries(categories).map(([id, override]) => {
        if (id === FALLBACK_SETTINGS_CATEGORY[surface] && override.hidden)
          throw new Error(
            `The ${SETTINGS_SURFACES[surface].label} category "${FALLBACK_SETTINGS_CATEGORY[surface]}" cannot be hidden.`,
          );
        return [id, Object.freeze({ ...override })];
      }),
    ),
  );
  return Object.freeze({
    parent: surface,
    routes: Object.freeze([]),
    categories: frozen,
  });
}

/** Whether a registered route belongs to the system settings surface. */
export function isSystemSettingsRoute(
  route: Pick<AppClientRegisteredRoute, 'surface'>,
): boolean {
  return route.surface === 'systemSettings';
}

/** Whether a registered route belongs to the personal settings surface. */
export function isPersonalSettingsRoute(
  route: Pick<AppClientRegisteredRoute, 'surface'>,
): boolean {
  return route.surface === 'personalSettings';
}

function freezeNavigationRoutes(
  routes: readonly AppClientRouteDefinition[],
): readonly AppClientRouteDefinition[] {
  return Object.freeze(
    routes.map((route) =>
      Object.freeze({
        ...route,
        ...(route.navigation
          ? { navigation: Object.freeze({ ...route.navigation }) }
          : {}),
        ...(route.children
          ? { children: freezeNavigationRoutes(route.children) }
          : {}),
      }),
    ) as AppClientRouteDefinition[],
  );
}

/**
 * What a bundler injects onto `import.meta`. Declared locally rather than globally: `vite/client` types `env` as
 * required, so a global augmentation here would conflict wherever both are loaded.
 */
interface ImportMetaWithBundlerEnv {
  readonly env?: { readonly PROD?: boolean; readonly DEV?: boolean };
}

function isDevelopment(): boolean {
  return !(import.meta as ImportMetaWithBundlerEnv).env?.PROD;
}

export function defineClientRouteComponentOverrides(
  overrides: readonly AppClientRouteComponentOverrideDefinition[],
): readonly AppClientRouteComponentOverrideDefinition[] {
  return Object.freeze(
    overrides.map((override) =>
      Object.freeze({
        ...override,
        routeId: normalizeRouteOverrideId(override.routeId),
        componentEntry: normalizeOptionalComponentEntry(
          override.componentEntry,
          override.routeId,
        ),
      }),
    ),
  );
}

export function defineClientSourceExtension(
  extension: AppClientSourceExtension,
): AppClientSourceExtension {
  const name = extension.name.trim();
  if (!name) {
    throw new Error('A client source extension must define a non-empty name.');
  }
  return Object.freeze({
    ...extension,
    name,
    routeComponentOverrides: extension.routeComponentOverrides
      ? defineClientRouteComponentOverrides(extension.routeComponentOverrides)
      : undefined,
  });
}

function normalizeRouteOverrideId(routeId: string): string {
  const normalized = routeId.trim();
  if (!normalized) {
    throw new Error(
      'A client route component override must define a non-empty routeId.',
    );
  }
  return normalized;
}

export function defineClientReactProviders(
  reactProviders: readonly AppClientReactProviderDefinition[],
): readonly AppClientReactProviderDefinition[] {
  return Object.freeze(
    reactProviders.map((reactProvider) =>
      Object.freeze({
        ...reactProvider,
        before: freezeOptionalList(reactProvider.before),
        after: freezeOptionalList(reactProvider.after),
      }),
    ),
  );
}

export function resolveAppClientContributions(
  contributions: readonly AppClientContributions[],
  options: ResolveAppClientContributionsOptions = {},
): ResolvedAppClientContributions {
  const routeIds = new Map<string, string>();
  const claimedPaths = new Map<string, ClaimedPath>();
  const reactProviders: AppClientRegisteredReactProvider[] = [];
  const reactProviderIds = new Set<string>();
  const inputs: RouteInput[] = [];
  const excludedRoutes = new Map<string, 'page' | 'group'>();
  function rememberDisabled(
    packageName: string,
    routes: readonly AppClientRouteDefinition[],
  ): void {
    for (const route of routes) {
      excludedRoutes.set(
        routeIdFor(route.name, packageName),
        route.componentLoader ? 'page' : 'group',
      );
      if (route.children) rememberDisabled(packageName, route.children);
    }
  }

  for (const contribution of contributions) {
    const packageName = normalizePackageName(contribution.packageName);
    const source = normalizeContributionSource(contribution.source);

    const routeContributions = normalizeRouteContributions(contribution.routes);
    for (const routeContribution of routeContributions) {
      const surface = routeContribution.parent as unknown;
      if (surface !== 'app' && !isSettingsSurface(surface)) {
        throw new Error(
          `Plugin "${packageName}" contributed routes to unsupported parent "${String(surface)}"; declare them with defineAppRoutes(), defineSystemSettingsRoutes() or definePersonalSettingsRoutes().`,
        );
      }
      if (
        (surface === 'systemSettings' &&
          options.systemSettingsRoutes === false) ||
        (surface === 'personalSettings' &&
          options.personalSettingsRoutes === false)
      ) {
        rememberDisabled(packageName, routeContribution.routes);
        continue;
      }
      const categories =
        'categories' in routeContribution
          ? routeContribution.categories
          : undefined;
      if (categories && source !== 'application')
        throw new Error(
          `Plugin "${packageName}" cannot change settings categories; only the application registers defineSettingsCategories().`,
        );
      inputs.push({
        definitions: routeContribution.routes,
        packageName,
        source,
        surface,
        ...(categories ? { categories } : {}),
      });
    }

    for (const reactProvider of contribution.reactProviders ?? []) {
      const registeredReactProvider = createRegisteredReactProvider(
        packageName,
        source,
        reactProvider,
      );
      if (reactProviderIds.has(registeredReactProvider.id)) {
        throw new Error(
          `Plugin "${packageName}" defined duplicate client reactProvider name "${registeredReactProvider.name}".`,
        );
      }

      reactProviderIds.add(registeredReactProvider.id);
      reactProviders.push(registeredReactProvider);
    }
  }

  const excludedRouteIds = options.excludedRouteIds?.length
    ? new Set(options.excludedRouteIds.map((id) => id.trim()).filter(Boolean))
    : undefined;
  const tree = assembleRoutes(inputs, excludedRouteIds);
  const roots = excludedRouteIds
    ? excludeRoutes(tree, excludedRouteIds, excludedRoutes)
    : tree;
  if (excludedRouteIds && isDevelopment()) {
    const packages = new Set(
      contributions.map(({ packageName }) => packageName.trim()),
    );
    for (const id of excludedRouteIds) {
      const separator = id.indexOf(':');
      if (separator < 1) continue;
      const packageName = id.slice(0, separator);
      if (packages.has(packageName) && !excludedRoutes.has(id))
        console.warn(
          `excludedRouteIds references missing route "${id}" from registered package "${packageName}".`,
        );
    }
  }
  const routes = Object.freeze([
    ...resolveRouteTree(
      roots.filter((node) => node.surface === 'app'),
      { parentPath: '', surface: 'app', ids: routeIds, claimed: claimedPaths },
    ),
    ...(['systemSettings', 'personalSettings'] as const).flatMap((surface) =>
      resolveRouteTree(
        roots.filter((node) => node.surface === surface),
        {
          parentPath: SETTINGS_SURFACES[surface].path,
          surface,
          ids: routeIds,
          claimed: claimedPaths,
        },
      ),
    ),
  ]);

  // A visible application page can reuse an ID from a disabled settings surface.
  for (const id of routeIds.keys()) excludedRoutes.delete(id);
  return Object.freeze({
    routes,
    ...(excludedRoutes.size ? { excludedRoutes } : {}),
    reactProviders: sortReactProviders(reactProviders),
  });
}

interface RouteInput {
  definitions: readonly AppClientRouteDefinition[];
  packageName: string;
  source: AppClientContributionSource;
  surface: AppClientRouteSurface;
  categories?: AppClientSettingsCategoryOverrides;
}

interface RouteNode {
  definition: AppClientRouteDefinition;
  packageName: string;
  source: AppClientContributionSource;
  surface: AppClientRouteSurface;
  children?: RouteNode[];
  /** The category id of a settings category group. */
  category?: string;
  builtIn?: boolean;
  hidden?: boolean;
}

function assembleRoutes(
  inputs: readonly RouteInput[],
  excludedRouteIds: ReadonlySet<string> | undefined,
): RouteNode[] {
  const roots: RouteNode[] = [];
  const groups = new Map<string, RouteNode>();
  const pending: { node: RouteNode; parent: string; category?: string }[] = [];
  const all: RouteNode[] = [];
  const categoryKey = (
    surface: AppClientSettingsRouteSurface,
    id: string,
  ): string => `${SETTINGS_SURFACES[surface].categoryPrefix}${id}`;
  // Every settings surface something contributes to starts with its built-in categories, titled in app-client's
  // namespace, which ships their default wording.
  for (const surface of ['systemSettings', 'personalSettings'] as const) {
    if (!inputs.some((input) => input.surface === surface)) continue;
    for (const [id, order] of BUILT_IN_SETTINGS_CATEGORIES[surface]) {
      const node: RouteNode = {
        definition: Object.freeze({
          name: `${surface}.${id}`,
          navigation: Object.freeze({
            title: `${SETTINGS_SURFACES[surface].titlePrefix}${id}`,
            order,
          }),
          children: Object.freeze([]),
          category: true,
        }),
        packageName: APP_CLIENT_NAMESPACE,
        source: 'application',
        surface,
        children: [],
        category: id,
        builtIn: true,
      };
      groups.set(categoryKey(surface, id), node);
      roots.push(node);
      all.push(node);
    }
  }
  for (const input of inputs) {
    const settings = isSettingsSurface(input.surface)
      ? input.surface
      : undefined;
    const copy = (
      definition: AppClientRouteDefinition,
      nested: boolean,
    ): RouteNode => {
      if (nested && definition.parent !== undefined)
        throw new Error(
          `app route "${definition.name}" cannot declare parent inside children.`,
        );
      const isGroup = !definition.componentLoader;
      const declaresCategory =
        'category' in definition && definition.category !== undefined;
      const declaresKind =
        'kind' in definition && definition.kind !== undefined;
      if (!settings && (declaresCategory || declaresKind))
        throw new Error(
          `app route "${definition.name}" from "${input.packageName}" cannot declare category or kind; they belong to settings routes.`,
        );
      if (declaresCategory && definition.category !== true)
        throw new Error(
          `Settings route "${definition.name}" from "${input.packageName}" must declare category: true or leave it out.`,
        );
      if (declaresKind && definition.kind !== 'module')
        throw new Error(
          `Settings route "${definition.name}" from "${input.packageName}" must declare kind: 'module' or leave it out.`,
        );
      const isCategory = declaresCategory;
      if (settings && isCategory) {
        if (!isGroup || nested || definition.parent !== undefined)
          throw new Error(
            `${capitalize(SETTINGS_SURFACES[settings].label)} category "${definition.name}" from "${input.packageName}" must be a group declared at the root, without parent.`,
          );
        if (declaresKind)
          throw new Error(
            `${capitalize(SETTINGS_SURFACES[settings].label)} category "${definition.name}" from "${input.packageName}" cannot also be a module.`,
          );
        // A category only groups the menu: it adds no URL segment and no breadcrumb level, so moving a page to another
        // category, or the application hiding one, never changes the page's address.
        if (
          definition.path !== undefined ||
          definition.breadcrumb !== undefined
        )
          throw new Error(
            `${capitalize(SETTINGS_SURFACES[settings].label)} category "${definition.name}" from "${input.packageName}" cannot declare path or breadcrumb; its pages keep their own paths.`,
          );
      } else if (settings && isGroup && !declaresKind)
        throw new Error(
          `${capitalize(SETTINGS_SURFACES[settings].label)} group "${definition.name}" from "${input.packageName}" must declare category: true at the root to add a category, or kind: 'module' to show its pages as tabs.`,
        );
      const node: RouteNode = {
        definition,
        packageName: input.packageName,
        source: input.source,
        surface: input.surface,
        ...(definition.children
          ? { children: definition.children.map((child) => copy(child, true)) }
          : {}),
      };
      all.push(node);
      if (isGroup) {
        const id =
          settings && isCategory
            ? categoryKey(
                settings,
                normalizeContributionName(
                  definition.name,
                  input.packageName,
                  'route',
                ),
              )
            : routeIdFor(definition.name, input.packageName);
        const previous = groups.get(id);
        if (previous)
          throw new Error(
            settings && isCategory
              ? previous.builtIn
                ? `${capitalize(SETTINGS_SURFACES[settings].label)} category "${definition.name}" from plugin "${input.packageName}" is built in; join it with parent instead, or change how it shows with defineSettingsCategories().`
                : `${capitalize(SETTINGS_SURFACES[settings].label)} category "${definition.name}" from plugin "${input.packageName}" is already registered by "${previous.packageName}".`
              : `Client route group "${id}" from plugin "${input.packageName}" is already registered by "${previous.packageName}".`,
          );
        if (settings && isCategory) {
          node.category = definition.name.trim();
          // Named after its surface like the built-in ones, so one package may declare a category of the same id in
          // both settings surfaces.
          node.definition = Object.freeze({
            ...definition,
            name: `${settings}.${node.category}`,
          });
        }
        groups.set(id, node);
      }
      return node;
    };
    for (const definition of input.definitions) {
      const node = copy(definition, false);
      if (definition.parent === undefined) {
        if (settings && !node.category && !definition.componentLoader)
          throw new Error(
            `${capitalize(SETTINGS_SURFACES[settings].label)} module "${definition.name}" from "${input.packageName}" must name its category with parent.`,
          );
        roots.push(node);
      } else {
        const parent = definition.parent.trim();
        pending.push({
          node,
          parent: parent.includes(':')
            ? parent
            : settings
              ? categoryKey(settings, parent)
              : routeIdFor(parent, input.packageName),
          category: !parent.includes(':') && settings ? parent : undefined,
        });
      }
    }
  }
  if (excludedRouteIds?.size) {
    for (const { category, definition, packageName } of roots) {
      if (category === undefined) continue;
      const id = routeIdFor(definition.name, packageName);
      if (excludedRouteIds.has(id))
        throw new Error(
          `excludedRouteIds cannot exclude shared settings category "${id}". Exclude its pages or modules by ID, or use defineSettingsCategories() to hide the category and move its pages to the fallback category.`,
        );
    }
  }
  // The application's overrides: a category keeps its id and stays registered, only how it shows changes.
  for (const input of inputs) {
    if (!input.categories || !isSettingsSurface(input.surface)) continue;
    for (const [id, override] of Object.entries(input.categories)) {
      const node = groups.get(categoryKey(input.surface, id));
      if (!node) {
        if (isDevelopment())
          console.warn(
            `defineSettingsCategories() names ${SETTINGS_SURFACES[input.surface].label} category "${id}", which nobody declares; ignoring it.`,
          );
        continue;
      }
      const navigation = node.definition.navigation!;
      node.definition = Object.freeze({
        ...node.definition,
        navigation: Object.freeze({
          ...navigation,
          ...(override.title !== undefined ? { title: override.title } : {}),
          ...(override.order !== undefined ? { order: override.order } : {}),
        }),
      });
      if (override.hidden) node.hidden = true;
    }
  }
  const fallback = (
    surface: AppClientSettingsRouteSurface,
    route: string,
    packageName: string,
    reason: string,
  ): RouteNode => {
    if (isDevelopment())
      console.warn(
        `${capitalize(SETTINGS_SURFACES[surface].label)} route "${route}" from "${packageName}" ${reason}; showing it under "${FALLBACK_SETTINGS_CATEGORY[surface]}".`,
      );
    return groups.get(
      categoryKey(surface, FALLBACK_SETTINGS_CATEGORY[surface]),
    )!;
  };
  for (const { node, parent, category } of pending) {
    let target = groups.get(parent);
    if (category !== undefined && isSettingsSurface(node.surface)) {
      if (!target)
        target = fallback(
          node.surface,
          node.definition.name,
          node.packageName,
          `references unknown category "${category}"`,
        );
      else if (target.hidden)
        target = fallback(
          node.surface,
          node.definition.name,
          node.packageName,
          `is in category "${category}", which the application hides`,
        );
    }
    if (!target)
      throw new Error(
        `${node.surface} route "${node.definition.name}" from "${node.packageName}" references missing group "${parent}" (the target must be a group, not a page).`,
      );
    if (target.surface !== node.surface)
      throw new Error(
        `${node.surface} route "${node.definition.name}" from "${node.packageName}" cannot join ${target.surface} group "${parent}"; declare it with ${defineFunctionOf(target.surface)}.`,
      );
    if (!target.children)
      throw new Error(`app group "${parent}" must declare children.`);
    target.children.push(node);
  }
  // A hidden category leaves the menu; what it declared inline moves to the fallback with the rest.
  for (const node of [...roots]) {
    if (!node.hidden || !isSettingsSurface(node.surface)) continue;
    roots.splice(roots.indexOf(node), 1);
    if (node.children?.length)
      groups
        .get(
          categoryKey(node.surface, FALLBACK_SETTINGS_CATEGORY[node.surface]),
        )!
        .children!.push(...node.children);
  }
  const visiting = new Set<RouteNode>();
  const visited = new Set<RouteNode>();
  const visit = (node: RouteNode): void => {
    if (visiting.has(node))
      throw new Error(
        `Circular app parent relationship at "${node.definition.name}".`,
      );
    if (visited.has(node)) return;
    visiting.add(node);
    for (const child of node.children ?? []) visit(child);
    visiting.delete(node);
    visited.add(node);
  };
  for (const node of all) visit(node);
  const sort = (nodes: RouteNode[]): void => {
    nodes.sort((a, b) => compareNavigationOrder(a.definition, b.definition));
    for (const node of nodes) if (node.children) sort(node.children);
  };
  sort(roots);
  return roots;
}

/**
 * Prune assembled subtrees before claiming their paths. The configured IDs are read-only, and excludedRoutes records
 * the routes actually removed, including descendants, so callers can distinguish exclusion from a missing route.
 */
function excludeRoutes(
  nodes: readonly RouteNode[],
  excludedIds: ReadonlySet<string>,
  excludedRoutes: Map<string, 'page' | 'group'>,
  excludeParent = false,
): RouteNode[] {
  return nodes.flatMap((node) => {
    const { definition, packageName } = node;
    const id = routeIdFor(definition.name, packageName);
    const excluded = excludeParent || excludedIds.has(id);
    const children =
      node.children &&
      excludeRoutes(node.children, excludedIds, excludedRoutes, excluded);
    const isPage = typeof definition.componentLoader === 'function';
    const emptiedGroup = !isPage && node.children?.length && !children?.length;
    if (excluded || emptiedGroup) {
      excludedRoutes.set(id, isPage ? 'page' : 'group');
      return [];
    }
    return [{ ...node, children }];
  });
}

function routeIdFor(name: string, packageName: string): string {
  return `${packageName}:${normalizeContributionName(name, packageName, 'route')}`;
}

function normalizeRouteContributions(
  contributions:
    | AppClientRouteContribution
    | readonly AppClientRouteContribution[]
    | undefined,
): readonly AppClientRouteContribution[] {
  if (contributions === undefined) {
    return [];
  }
  return 'parent' in contributions ? [contributions] : contributions;
}

export function applyClientRouteComponentOverrides(
  routes: readonly AppClientRegisteredRoute[],
  overrides: readonly AppClientRouteComponentOverrideDefinition[],
): readonly AppClientRegisteredRoute[] {
  const flatten = (
    nodes: readonly AppClientRegisteredRoute[],
  ): AppClientRegisteredRoute[] =>
    nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
  const routesById = new Map(flatten(routes).map((route) => [route.id, route]));
  const loadersByRouteId = new Map<string, AppClientRouteComponentLoader>();
  const presentationsByRouteId = new Map<
    string,
    AppClientRoutePresentation | undefined
  >();

  for (const override of overrides) {
    const routeId = override.routeId.trim();
    if (!routeId) {
      throw new Error(
        'A client route component override must define a non-empty routeId.',
      );
    }
    if (loadersByRouteId.has(routeId)) {
      throw new Error(
        `Client route component "${routeId}" is overridden more than once.`,
      );
    }
    if (!routesById.has(routeId)) {
      throw new Error(
        `Client route component override references missing route "${routeId}".`,
      );
    }
    if (!routesById.get(routeId)?.componentLoader)
      throw new Error(
        `Client route component override cannot target group "${routeId}".`,
      );
    if (typeof override.componentLoader !== 'function') {
      throw new Error(
        `Client route component override for "${routeId}" must define a componentLoader function.`,
      );
    }
    loadersByRouteId.set(routeId, override.componentLoader);
    presentationsByRouteId.set(
      routeId,
      override.presentation === undefined
        ? undefined
        : normalizePresentation(
            override.presentation,
            routeId,
            routesById.get(routeId)!.packageName,
          ),
    );
  }

  const replace = (
    nodes: readonly AppClientRegisteredRoute[],
  ): readonly AppClientRegisteredRoute[] =>
    Object.freeze(
      nodes.map((route) => {
        const loader = loadersByRouteId.get(route.id);
        const presentation = presentationsByRouteId.get(route.id);
        const { presentation: _replaced, ...rest } = route;
        return Object.freeze({
          ...(loader ? rest : route),
          ...(loader
            ? {
                componentLoader: wrapRouteComponentLoader(loader, route.id),
                ...(presentation ? { presentation } : {}),
              }
            : {}),
          ...(route.children ? { children: replace(route.children) } : {}),
        });
      }),
    );
  return replace(routes);
}

function freezeOptionalList(
  values: readonly string[] | undefined,
): readonly string[] | undefined {
  return values ? Object.freeze([...values]) : undefined;
}

function normalizeOptionalComponentEntry(
  componentEntry: string | undefined,
  routeId: string,
): string | undefined {
  if (componentEntry === undefined) {
    return undefined;
  }
  const normalized = componentEntry.trim();
  if (!normalized) {
    throw new Error(
      `Client route component override for "${routeId}" must define a non-empty componentEntry when provided.`,
    );
  }
  return normalized;
}

function normalizePackageName(packageName: string): string {
  const normalized = packageName.trim();
  if (!normalized) {
    throw new Error('A client contribution must define a package name.');
  }
  return normalized;
}

function normalizeContributionSource(
  source: AppClientContributionSource | undefined,
): AppClientContributionSource {
  return source ?? 'plugin';
}

interface ClaimedPath {
  readonly id: string;
  readonly path: string;
  readonly packageName: string;
}

function normalizeTitle(
  title: string,
  id: string,
  packageName: string,
): string {
  const normalized = title.trim();
  if (!normalized) {
    throw new Error(
      `Client route "${id}" from plugin "${packageName}" must define a non-empty title.`,
    );
  }
  return normalized;
}

const ROUTE_PRESENTATION_KINDS: ReadonlySet<string> = new Set([
  'content',
  'child-page',
  'dialog',
  'drawer',
]);

function normalizePresentation(
  presentation: AppClientRoutePresentation,
  id: string,
  packageName: string,
): AppClientRoutePresentation {
  const kind = (presentation as { kind?: unknown } | null)?.kind;
  if (typeof kind !== 'string' || !ROUTE_PRESENTATION_KINDS.has(kind))
    throw new Error(
      `Client route "${id}" presentation must be one of content, child-page, dialog or drawer.`,
    );
  const overlay = kind === 'dialog' || kind === 'drawer';
  if (!overlay) {
    if (
      presentation.title !== undefined ||
      presentation.namespace !== undefined
    )
      throw new Error(
        `Client route "${id}" presentation "${kind}" cannot declare a title or namespace.`,
      );
    return Object.freeze({ kind: kind as AppClientRoutePresentationKind });
  }
  if (typeof presentation.title !== 'string')
    throw new Error(
      `Client route "${id}" presentation "${kind}" must define a title.`,
    );
  const namespace = presentation.namespace?.trim();
  if (presentation.namespace !== undefined && !namespace)
    throw new Error(
      `Client route "${id}" presentation namespace must not be empty.`,
    );
  return Object.freeze({
    kind,
    title: normalizeTitle(presentation.title, id, packageName),
    ...(namespace ? { namespace } : {}),
  });
}

function normalizeNavigation(
  navigation: AppClientRouteNavigation,
  id: string,
  packageName: string,
): AppClientRouteNavigation {
  const { description, ...rest } = navigation;
  const trimmed = description?.trim();
  if (navigation.badge !== undefined && typeof navigation.badge !== 'function')
    throw new Error(
      `Client route "${id}" from plugin "${packageName}" navigation badge must be a hook function.`,
    );
  return Object.freeze({
    ...rest,
    title: normalizeTitle(navigation.title, id, packageName),
    // A blank description is no description, so an overview never shows an empty line.
    ...(trimmed ? { description: trimmed } : {}),
  });
}

interface RouteResolveContext {
  parentPath: string;
  surface: AppClientRouteSurface;
  parentAuth?: AppClientRouteAuth;
  /** Effective authz of the nearest ancestor page; groups pass it through. */
  ancestorAuthz?: AppClientRouteAuthz;
  ids: Map<string, string>;
  claimed: Map<string, ClaimedPath>;
}

function resolveRouteTree(
  nodes: readonly RouteNode[],
  context: RouteResolveContext,
): readonly AppClientRegisteredRoute[] {
  const { parentPath, parentAuth, ids, claimed } = context;
  return Object.freeze(nodes.map(resolveNode));

  function resolveNode(node: RouteNode): AppClientRegisteredRoute {
    const { definition: route, packageName, source } = node;
    const name = normalizeContributionName(route.name, packageName, 'route');
    const id = `${packageName}:${name}`;
    const isPage = typeof route.componentLoader === 'function';
    if ('componentLoader' in route && !isPage)
      throw new Error(
        `Client route "${id}" must define a componentLoader function.`,
      );
    if (!isPage && !route.children)
      throw new Error(
        `Client route "${id}" must define a componentLoader function.`,
      );
    if (!isPage && !route.navigation)
      throw new Error(`Client route group "${id}" must define navigation.`);
    const rawPath = route.path;
    if (isPage && rawPath === undefined)
      throw new Error(`Client route "${id}" must define a path.`);
    const relative =
      rawPath === undefined
        ? ''
        : normalizeRoutePath(
            parentPath ? '/' + rawPath.replace(/^\/+/, '') : rawPath,
            packageName,
            name,
          );
    const path =
      `${parentPath.replace(/\/$/, '')}${relative === '/' && parentPath ? '' : relative}` ||
      '/';
    const declaredAuth = 'auth' in route ? route.auth : undefined;
    if (parentAuth && declaredAuth && parentAuth !== declaredAuth)
      throw new Error(
        `Client route "${id}" cannot change inherited auth "${parentAuth}".`,
      );
    const auth = normalizeRouteAuth(
      parentAuth ?? declaredAuth,
      packageName,
      name,
    );
    if (isPage && path === '/' && source !== 'application')
      throw new Error(
        `Client route "${name}" from plugin "${packageName}" cannot use reserved application root path "/".`,
      );
    if (
      RESERVED_APPLICATION_ROUTE_PATHS.has(path.toLowerCase()) &&
      auth !== 'guest'
    )
      throw new Error(
        `Client route "${name}" cannot use reserved path "${path}" unless auth is "guest".`,
      );
    const navigation = route.navigation
      ? normalizeNavigation(route.navigation, id, packageName)
      : undefined;
    const declaredPresentation =
      'presentation' in route ? route.presentation : undefined;
    if (declaredPresentation !== undefined && !isPage)
      throw new Error(
        `Client route group "${id}" cannot declare presentation.`,
      );
    const presentation =
      declaredPresentation === undefined
        ? undefined
        : normalizePresentation(declaredPresentation, id, packageName);
    if (
      navigation &&
      isPage &&
      path
        .split('/')
        .some((segment) => segment.startsWith(':') || segment.includes('*'))
    )
      throw new Error(
        `Client route "${id}" navigation requires a static path.`,
      );
    // A menu entry needs a static path; a breadcrumb does not, since it names the kind of page rather than the
    // record. Nothing falls back to anything: a route in both a menu and a trail declares both.
    const breadcrumb = route.breadcrumb
      ? Object.freeze({
          ...route.breadcrumb,
          title: normalizeTitle(route.breadcrumb.title, id, packageName),
        })
      : undefined;
    if (isPage) {
      const signature = createRoutePathSignature(path);
      const previous = claimed.get(signature);
      if (previous)
        throw new Error(
          `Client route path "${path}" from plugin "${packageName}" conflicts with route "${previous.id}" at "${previous.path}"; already registered.`,
        );
      claimed.set(signature, { id, path, packageName });
    }
    // Names identify override targets across the package.
    if (ids.has(id)) {
      throw new Error(
        `Plugin "${packageName}" defined duplicate client route name "${name}".`,
      );
    }
    ids.set(id, packageName);
    const authz = normalizeRouteAuthz(route, id, path, isPage, auth, context);
    return Object.freeze({
      id,
      name,
      path,
      auth,
      packageName,
      source,
      ...(context.surface !== 'app' ? { surface: context.surface } : {}),
      ...(node.category !== undefined
        ? { kind: 'category' as const, category: node.category }
        : 'kind' in route && route.kind === 'module'
          ? { kind: 'module' as const }
          : {}),
      ...(breadcrumb ? { breadcrumb } : {}),
      ...(navigation ? { navigation } : {}),
      ...(presentation ? { presentation } : {}),
      authz,
      ...(isPage
        ? {
            componentLoader: wrapRouteComponentLoader(
              route.componentLoader,
              id,
            ),
          }
        : {}),
      ...(node.children
        ? {
            children: resolveRouteTree(node.children, {
              ...context,
              parentPath: path,
              parentAuth: auth,
              ancestorAuthz: isPage ? authz : context.ancestorAuthz,
            }),
          }
        : {}),
    });
  }
}

function normalizeRouteAuthz(
  route: RouteNode['definition'],
  id: string,
  path: string,
  isPage: boolean,
  auth: AppClientRouteAuth,
  context: RouteResolveContext,
): AppClientRouteAuthz {
  if ('access' in route) {
    throw new Error(
      `Client route "${id}" uses removed access; declare authz instead.`,
    );
  }
  const value = 'authz' in route ? route.authz : undefined;
  if (value !== undefined) {
    if (!isPage)
      throw new Error(`Client route group "${id}" cannot declare authz.`);
    if (value === 'skip' || value === 'unrestricted') return value;
    if (
      !value ||
      typeof value !== 'object' ||
      !('resource' in value) ||
      !value.resource ||
      typeof value.resource !== 'object' ||
      typeof value.resource.type !== 'string' ||
      !value.resource.type.trim() ||
      typeof value.resource.id !== 'string' ||
      !value.resource.id.trim() ||
      typeof value.action !== 'string' ||
      !value.action.trim()
    )
      throw new Error(
        `Client route "${id}" must use authz "skip", "unrestricted" or { resource: { type, id }, action }.`,
      );
    return Object.freeze({
      resource: Object.freeze({ ...value.resource }),
      action: value.action,
    });
  }
  if (!isPage) return 'skip';
  if (context.ancestorAuthz !== undefined) return context.ancestorAuthz;
  // Personal settings belong to whoever is signed in, so an omission there opens the page to every signed-in person.
  if (context.surface === 'personalSettings' && auth === 'required')
    return 'skip';
  // An omission never stops the application: a protected page stays closed to all but unrestricted identities.
  const fallback = auth !== 'required' ? 'skip' : 'unrestricted';
  if (isDevelopment())
    console.warn(
      `Client route "${id}" at "${path}" does not declare authz; using "${fallback}". Declare authz on this page: { resource: { type, id }, action } or "skip".`,
    );
  return fallback;
}

function normalizeRouteAuth(
  auth: AppClientRouteAuth | undefined,
  packageName: string,
  routeName: string,
): AppClientRouteAuth {
  const normalized = auth ?? 'required';
  if (
    normalized !== 'required' &&
    normalized !== 'guest' &&
    normalized !== 'optional'
  ) {
    throw new Error(
      `Client route "${routeName}" from plugin "${packageName}" must use auth "required", "guest", or "optional".`,
    );
  }
  return normalized;
}

function createRegisteredReactProvider(
  packageName: string,
  source: AppClientContributionSource,
  reactProvider: AppClientReactProviderDefinition,
): AppClientRegisteredReactProvider {
  const name = normalizeContributionName(
    reactProvider.name,
    packageName,
    'reactProvider',
  );
  if (!reactProvider.component) {
    throw new Error(
      `Client reactProvider "${name}" from plugin "${packageName}" must define a component.`,
    );
  }
  const layer = normalizeReactProviderLayer(
    reactProvider.layer,
    source,
    packageName,
    name,
  );

  return Object.freeze({
    id: `${packageName}:${name}`,
    name,
    packageName,
    source,
    layer,
    component: reactProvider.component,
    before: normalizeReactProviderTargets(
      reactProvider.before,
      packageName,
      name,
    ),
    after: normalizeReactProviderTargets(
      reactProvider.after,
      packageName,
      name,
    ),
  });
}

function normalizeReactProviderLayer(
  layer: AppClientReactProviderLayer | undefined,
  source: AppClientContributionSource,
  packageName: string,
  reactProviderName: string,
): AppClientReactProviderLayer {
  const normalized =
    layer ?? (source === 'application' ? 'application' : 'extension');
  if (
    normalized !== 'root' &&
    normalized !== 'application' &&
    normalized !== 'extension'
  ) {
    throw new Error(
      `Client reactProvider "${reactProviderName}" from "${packageName}" uses unsupported layer "${String(layer)}".`,
    );
  }
  if (source === 'plugin' && normalized !== 'extension') {
    throw new Error(
      `Client reactProvider "${reactProviderName}" from plugin "${packageName}" cannot use layer "${normalized}"; plugin reactProviders must use layer "extension".`,
    );
  }
  if (source === 'application' && normalized === 'extension') {
    throw new Error(
      `Client reactProvider "${reactProviderName}" from application "${packageName}" cannot use layer "extension"; application reactProviders must use layer "root" or "application".`,
    );
  }
  return normalized;
}

function normalizeContributionName(
  name: string,
  packageName: string,
  type: 'reactProvider' | 'route',
): string {
  const normalized = name.trim();
  if (!normalized) {
    throw new Error(
      `Client ${type} from plugin "${packageName}" must define a non-empty name.`,
    );
  }
  if (!CONTRIBUTION_NAME_PATTERN.test(normalized)) {
    throw new Error(
      `Client ${type} name "${name}" from plugin "${packageName}" contains unsupported characters.`,
    );
  }
  return normalized;
}

function normalizeReactProviderTargets(
  targets: readonly string[] | undefined,
  packageName: string,
  reactProviderName: string,
): readonly string[] | undefined {
  if (!targets) {
    return undefined;
  }

  const normalized = targets.map((target) => target.trim());
  if (normalized.some((target) => !target || !target.includes(':'))) {
    throw new Error(
      `Client reactProvider "${reactProviderName}" from plugin "${packageName}" must reference reactProviders by their full plugin-qualified ID.`,
    );
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(
      `Client reactProvider "${reactProviderName}" from plugin "${packageName}" contains duplicate ordering references.`,
    );
  }
  return Object.freeze(normalized);
}

function normalizeRoutePath(
  routePath: string,
  packageName: string,
  routeName: string,
): string {
  const trimmed = routePath.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.includes('\\') ||
    trimmed.includes('?') ||
    trimmed.includes('#') ||
    trimmed.includes('*') ||
    trimmed.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error(
      `Client route "${routeName}" from plugin "${packageName}" must use an absolute application path without query, hash, wildcard, or traversal segments.`,
    );
  }

  const normalized =
    trimmed === '/'
      ? '/'
      : trimmed.replace(/\/+$/g, '').replace(/\/{2,}/g, '/');
  return normalized;
}

function createRoutePathSignature(routePath: string): string {
  return routePath
    .split('/')
    .map((segment) => (segment.startsWith(':') ? ':' : segment.toLowerCase()))
    .join('/');
}

function wrapRouteComponentLoader(
  componentLoader: AppClientRouteComponentLoader,
  id: string,
): AppClientRouteComponentLoader {
  return async () => {
    try {
      const module = await componentLoader();
      if (typeof module.default !== 'function') {
        throw new Error(
          'The route component module must default-export a React component.',
        );
      }
      return module;
    } catch (error) {
      throw new Error(`Failed to load client route "${id}".`, {
        cause: error,
      });
    }
  };
}

function sortReactProviders(
  reactProviders: readonly AppClientRegisteredReactProvider[],
): readonly AppClientRegisteredReactProvider[] {
  const reactProvidersById = new Map(
    reactProviders.map((reactProvider) => [reactProvider.id, reactProvider]),
  );
  for (const reactProvider of reactProviders) {
    for (const targetId of [
      ...(reactProvider.before ?? []),
      ...(reactProvider.after ?? []),
    ]) {
      assertReactProviderTarget(reactProvidersById, reactProvider.id, targetId);
      const target = reactProvidersById.get(targetId);
      if (target && target.layer !== reactProvider.layer) {
        throw new Error(
          `Client reactProvider "${reactProvider.id}" in layer "${reactProvider.layer}" cannot declare ordering against reactProvider "${target.id}" in layer "${target.layer}"; before/after constraints may only reference reactProviders in the same layer.`,
        );
      }
    }
  }

  const layerOrder: readonly AppClientReactProviderLayer[] = [
    'root',
    'application',
    'extension',
  ];
  const sorted = layerOrder.flatMap((layer) =>
    sortReactProviderLayer(
      reactProviders.filter((reactProvider) => reactProvider.layer === layer),
    ),
  );
  return Object.freeze(sorted);
}

function sortReactProviderLayer(
  reactProviders: readonly AppClientRegisteredReactProvider[],
): readonly AppClientRegisteredReactProvider[] {
  const reactProvidersById = new Map(
    reactProviders.map((reactProvider) => [reactProvider.id, reactProvider]),
  );
  const registrationIndex = new Map(
    reactProviders.map((reactProvider, index) => [reactProvider.id, index]),
  );
  const outgoing = new Map(
    reactProviders.map((reactProvider) => [
      reactProvider.id,
      new Set<string>(),
    ]),
  );
  const indegree = new Map(
    reactProviders.map((reactProvider) => [reactProvider.id, 0]),
  );

  const addEdge = (from: string, to: string): void => {
    const targets = outgoing.get(from);
    if (!targets || targets.has(to)) {
      return;
    }
    targets.add(to);
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
  };

  for (const reactProvider of reactProviders) {
    for (const target of reactProvider.before ?? []) {
      assertReactProviderTarget(reactProvidersById, reactProvider.id, target);
      addEdge(reactProvider.id, target);
    }
    for (const target of reactProvider.after ?? []) {
      assertReactProviderTarget(reactProvidersById, reactProvider.id, target);
      addEdge(target, reactProvider.id);
    }
  }

  const ready = reactProviders
    .filter((reactProvider) => indegree.get(reactProvider.id) === 0)
    .map((reactProvider) => reactProvider.id);
  const sorted: AppClientRegisteredReactProvider[] = [];

  while (ready.length > 0) {
    ready.sort(
      (left, right) =>
        (registrationIndex.get(left) ?? 0) -
        (registrationIndex.get(right) ?? 0),
    );
    const id = ready.shift();
    if (!id) {
      break;
    }
    const reactProvider = reactProvidersById.get(id);
    if (!reactProvider) {
      continue;
    }
    sorted.push(reactProvider);

    for (const target of outgoing.get(id) ?? []) {
      const nextIndegree = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, nextIndegree);
      if (nextIndegree === 0) {
        ready.push(target);
      }
    }
  }

  if (sorted.length !== reactProviders.length) {
    const cycle = findReactProviderCycle(reactProviders, outgoing);
    throw new Error(
      `Circular client reactProvider order detected: ${cycle.join(' -> ')}.`,
    );
  }

  return Object.freeze(sorted);
}

function assertReactProviderTarget(
  reactProvidersById: ReadonlyMap<string, AppClientRegisteredReactProvider>,
  reactProviderId: string,
  targetId: string,
): void {
  if (!reactProvidersById.has(targetId)) {
    throw new Error(
      `Client reactProvider "${reactProviderId}" references missing reactProvider "${targetId}".`,
    );
  }
}

function findReactProviderCycle(
  reactProviders: readonly AppClientRegisteredReactProvider[],
  outgoing: ReadonlyMap<string, ReadonlySet<string>>,
): readonly string[] {
  const visited = new Set<string>();
  const active = new Set<string>();
  const path: string[] = [];

  const visit = (id: string): readonly string[] | undefined => {
    if (active.has(id)) {
      const cycleStart = path.indexOf(id);
      return [...path.slice(cycleStart), id];
    }
    if (visited.has(id)) {
      return undefined;
    }

    visited.add(id);
    active.add(id);
    path.push(id);
    for (const target of outgoing.get(id) ?? []) {
      const cycle = visit(target);
      if (cycle) {
        return cycle;
      }
    }
    path.pop();
    active.delete(id);
    return undefined;
  };

  for (const reactProvider of reactProviders) {
    const cycle = visit(reactProvider.id);
    if (cycle) {
      return cycle;
    }
  }

  return reactProviders.map((reactProvider) => reactProvider.id);
}

export {
  AppAsideOutlet,
  AppLayoutProviders,
  defineLayoutExtensions,
  resolveLayoutExtensions,
  useLayoutExtensions,
  type AppClientLayoutExtensionDefinition,
  type AppClientLayoutExtensions,
  type AppClientRegisteredLayoutExtension,
} from './layout-extensions.js';
export {
  applyHeaderActionOverrides,
  badgeCount,
  defineHeaderActionOverrides,
  defineHeaderActions,
  resolveHeaderActions,
  type AppClientBadge,
  type AppClientBadgeHook,
  type AppClientBadgeTone,
  type AppClientHeaderActionDefinition,
  type AppClientHeaderActionOverride,
  type AppClientHeaderActions,
  type AppClientRegisteredHeaderAction,
} from './header-actions.js';

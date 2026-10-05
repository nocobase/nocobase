import {
  AppClientProviders,
  ClientApplication,
  createAppClientConfig,
  defineAppClientRenderConfig,
  toasterToken,
  type AppClientRenderConfig,
} from '@nocobase/app-client';
import {
  defineClientPlugins,
  type AppClientPluginRegistration,
} from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { resolveLocalesContribution } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope } from '@nocobase/i18n/client';
import {
  createTestI18nRuntime,
  type TestNamespaceResources,
} from '@nocobase/i18n/testing';
import { ServiceProvider } from '@nocobase/service-provider';
import { render, type RenderResult } from '@testing-library/react';
import {
  createElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { MemoryRouter } from 'react-router';
import { onTestFinished } from 'vitest';

import { TestToaster, TestToasts, type TestToast } from './toaster.js';

/** A server that answers in process: what `createTestApp()` from `@nocobase/app-testing/server` returns qualifies. */
export interface TestClientServer {
  readonly fetch: (request: Request) => Response | Promise<Response>;
  /** The application's public base path, such as `/main`; empty or `/` when it is served at the root. */
  readonly publicBasePath: string;
}

export interface RenderWithAppOptions {
  /** The client plugins the application registers, as its `client/plugins.ts` lists them, such as `hub()`. */
  readonly plugins?: readonly AppClientPluginRegistration[];
  /**
   * The namespace the page translates in: the owning package for a page rendered under its own routes. Leave it out
   * for a component the application renders in its own scope.
   */
  readonly namespace?: string;
  /** Where the router starts; `/` by default. */
  readonly route?: string;
  /**
   * The server the API client talks to, such as an application from `createTestApp()`. Requests go to its API root in
   * process; nothing listens on a port.
   */
  readonly server?: TestClientServer;
  /** A `cookie` header sent with every request to `server`, such as the `cookie` of a session from `signIn()`. */
  readonly cookie?: string;
  /**
   * Answers the API client's requests when there is no `server`. A request nothing answers fails the call that sent
   * it, so a page never reaches a real network.
   */
  readonly fetch?: (request: Request) => Response | Promise<Response>;
  /** Client configuration, section by section, merged over what the test application sets: `app` and `api`. */
  readonly config?: Readonly<Record<string, unknown>>;
  /**
   * Registers services before the plugins do, such as a stand-in for another plugin's client service. A service
   * registered here and by a plugin fails the start, so leave out the plugin a stand-in replaces.
   */
  readonly services?: (app: ClientApplication) => void;
  /** Translations of namespaces besides the plugins' own, keyed by package name. */
  readonly namespaces?: Readonly<Record<string, TestNamespaceResources>>;
  /** The locale the page renders in; `en-US` by default. */
  readonly locale?: string;
  /**
   * Whether a key no namespace has fails the render; on by default, as `createTestI18nRuntime()` is. Turn it off only
   * for a page that renders keys it deliberately does not own.
   */
  readonly strictTranslations?: boolean;
}

/** A page rendered in a started test application. */
export interface RenderedApp extends RenderResult {
  readonly app: ClientApplication;
  /** The toasts open now, oldest first. They are also rendered after the page, as plain text. */
  toasts(): readonly TestToast[];
}

/** Where requests go when no server is given, so the API client builds absolute URLs as it does in a browser. */
const TEST_ORIGIN = 'http://localhost';

/**
 * Starts a client application with `plugins` and renders `ui` inside it the way the application renders a page: the
 * same `ClientApplication`, its services, translations, React providers and Refine, under a `MemoryRouter`. The page
 * reads `useApiClient()`, `useService()`, `useToaster()` and `useTranslation()` from the real implementations rather
 * than mocks of `@nocobase/app-client`; the API client talks to `server` or `fetch`. Call it inside a test: the
 * application shuts down when the test finishes.
 */
export async function renderWithApp(
  ui: ReactElement,
  options: RenderWithAppOptions = {},
): Promise<RenderedApp> {
  const plugins = options.plugins ?? [];
  const toaster = new TestToaster();
  const basePath = options.server
    ? trimTrailingSlash(options.server.publicBasePath)
    : '';
  const apiRoot = `${TEST_ORIGIN}${basePath}/api`;
  const rawConfig = mergeSections(
    { app: { basePath: basePath || '/' }, api: { baseURL: apiRoot } },
    options.config ?? {},
  );
  // The page reads the mount path the server rendered into it, as `resolveAppUrl()` does, so the block the server
  // renders is written into the document for the test.
  const removeConfigBlock = writeRuntimeConfigBlock(rawConfig);

  class TestServiceProvider extends ServiceProvider<ClientApplication> {
    public readonly name: string = '@nocobase/app-testing/client';

    public override register(): void {
      options.services?.(this.app);
      if (!this.app.container.has(toasterToken)) {
        this.app.container.instance(toasterToken, toaster);
      }
    }
  }

  // A plugin's locales may be a function importing its locale module; the test runtime takes the module itself.
  const pluginLocales = await Promise.all(
    plugins.flatMap((plugin) =>
      plugin.locales
        ? [
            resolveLocalesContribution(plugin.locales).then(
              (locales): [string, TestNamespaceResources] => [
                plugin.packageName,
                locales,
              ],
            ),
          ]
        : [],
    ),
  );
  const i18n = await createTestI18nRuntime({
    ...(options.locale ? { locale: options.locale } : {}),
    ...(options.strictTranslations === undefined
      ? {}
      : { strict: options.strictTranslations }),
    namespaces: {
      ...Object.fromEntries(pluginLocales),
      ...options.namespaces,
    },
  });
  // The strict runtime stands in for the one the application would build, so each locale module loads once.
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@nocobase/app-testing',
      createAppConfig: createAppClientConfig,
      serviceProviders: [TestServiceProvider],
      plugins: defineClientPlugins(plugins),
    }),
    { rawConfig, rawPublicConfig: {}, i18n },
  );
  const AppI18nProvider = ({ children }: PropsWithChildren): ReactElement =>
    createElement(I18nProvider, { runtime: i18n }, children);
  const AppToasts = ({ children }: PropsWithChildren): ReactElement =>
    createElement(TestToasts, { toaster }, children);
  const app = new ClientApplication({
    runtime,
    fetch: createFetch(options, apiRoot),
    createRenderConfig: (): AppClientRenderConfig =>
      defineAppClientRenderConfig({
        basename: runtime.basename,
        reactProviders: [
          AppI18nProvider,
          ...runtime.reactProviders.map((provider) => provider.component),
          AppToasts,
        ],
        routes: null,
      }),
  });
  runtime.app = app;
  // Registered before the page renders, so a page that throws while rendering still takes the application with it.
  // Testing Library's own cleanup unmounts the page first; a start that fails shuts the application down itself.
  onTestFinished(async () => {
    toaster.dispose();
    removeConfigBlock();
    await app.shutdown();
  });
  await app.start();

  const view = render(
    <MemoryRouter initialEntries={[options.route ?? '/']}>
      <AppClientProviders app={app}>
        {options.namespace ? (
          <NamespaceScope ns={options.namespace}>{ui}</NamespaceScope>
        ) : (
          ui
        )}
      </AppClientProviders>
    </MemoryRouter>,
  );
  return Object.assign(view, {
    app,
    toasts: (): readonly TestToast[] => toaster.list(),
  });
}

/** The id and shape of the block the server renders into the page, as `@nocobase/app-client` reads them. */
const RUNTIME_CONFIG_ELEMENT_ID = 'nocobase-runtime-config';

/**
 * Writes the client configuration into the document the way the server renders it, so `resolveAppUrl()` and
 * `resolveAppBase()` find the mount path. Returns what removes it again. A block already in the document — one the
 * test wrote itself — is left alone.
 */
function writeRuntimeConfigBlock(config: Record<string, unknown>): () => void {
  if (document.getElementById(RUNTIME_CONFIG_ELEMENT_ID)) return () => {};
  const element = document.createElement('script');
  element.id = RUNTIME_CONFIG_ELEMENT_ID;
  element.type = 'application/json';
  element.textContent = JSON.stringify({ version: 1, config });
  document.head.append(element);
  return (): void => {
    element.remove();
  };
}

/**
 * The `fetch` the API client sends through: to the server in process, with the session cookie, or to the test's own
 * handler. A request nothing answers is refused with the reason rather than sent anywhere.
 */
function createFetch(
  options: RenderWithAppOptions,
  apiRoot: string,
): typeof globalThis.fetch {
  const answer =
    options.server?.fetch ??
    options.fetch ??
    ((request: Request): Response => {
      throw new Error(
        `Nothing answers ${request.method} ${request.url}: pass server or fetch to renderWithApp().`,
      );
    });
  return async (input, init): Promise<Response> => {
    const request =
      input instanceof Request
        ? new Request(input, init)
        : new Request(new URL(String(input), apiRoot), init);
    if (options.server && options.cookie) {
      request.headers.set(
        'cookie',
        [request.headers.get('cookie'), options.cookie]
          .filter(Boolean)
          .join('; '),
      );
    }
    return answer(request);
  };
}

function mergeSections(
  base: Readonly<Record<string, unknown>>,
  overrides: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };
  for (const [section, value] of Object.entries(overrides)) {
    const current = merged[section];
    merged[section] =
      isRecord(current) && isRecord(value) ? { ...current, ...value } : value;
  }
  return merged;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

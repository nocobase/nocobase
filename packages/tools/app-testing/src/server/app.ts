import path from 'node:path';

import type { Application } from '@nocobase/app-server/application';
import type {
  StandaloneServer,
  StandaloneServerOptions,
} from '@nocobase/app-server/node';
import {
  databaseManagerToken,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';

import {
  createTestAppConfig,
  type CreateTestAppConfigOptions,
  type TestAppConfig,
} from './app-config.js';

/** An application's standalone server factory: `createStandaloneServer` from its `server/standalone.ts`. */
export type TestAppServerFactory = (
  options: StandaloneServerOptions,
) => Promise<StandaloneServer>;

export interface CreateTestAppOptions extends CreateTestAppConfigOptions {
  /** How the application starts itself, the same factory `pnpm start` runs. */
  readonly createServer: TestAppServerFactory;
  /**
   * Further options for the standalone server, such as `env` or `paths`. The configuration file is the test's own; the
   * Vite development proxy is off unless set here.
   */
  readonly server?: Omit<StandaloneServerOptions, 'configPath'>;
}

/** An application started on test databases of its own. */
export interface TestApp {
  readonly server: StandaloneServer;
  readonly application: Application;
  /** The application's public base path, such as `/main`. */
  readonly publicBasePath: string;
  /** Handles a request in process, as the HTTP server would. */
  readonly fetch: (request: Request) => Response | Promise<Response>;
  /** The application's database manager, on the provisioned databases. */
  readonly database: DatabaseManager;
  /** The default connection. */
  readonly connection: DatabaseConnection;
  /** The configuration file and the databases it names. */
  readonly config: TestAppConfig;
  /**
   * Sends a request to the application anonymously. A path starting with `/` is resolved against the application's
   * API root, so `request('/healthz')` reaches `<publicBasePath>/api/healthz`.
   */
  readonly request: (path: string, init?: RequestInit) => Promise<Response>;
  /** Stops the application, then drops its databases and removes its files. */
  close(): Promise<void>;
}

/**
 * Starts an application the way `pnpm start` does — through its own standalone server, with its own runtime,
 * providers and plugins — on test databases of its own, provisioned by `createTestAppConfig()`. Storage goes to the
 * configuration's temporary directory, so applications started side by side never share a queue or a jobs state.
 */
export async function createTestApp(
  options: CreateTestAppOptions,
): Promise<TestApp> {
  const {
    createServer,
    server: serverOptions = {},
    ...configOptions
  } = options;
  const config = await createTestAppConfig(configOptions);
  let server: StandaloneServer;
  try {
    server = await createServer({
      viteDevUrl: false,
      ...serverOptions,
      configPath: config.path,
      env: {
        APP_STORAGE_DIR: path.join(config.directory, 'storage'),
        ...serverOptions.env,
      },
    });
  } catch (error) {
    await config.dispose();
    throw error;
  }
  const { application } = server;
  const database = application.container.resolve(databaseManagerToken);
  const apiRoot = `http://localhost${trimTrailingSlash(application.publicBasePath)}/api`;
  const fetch = (request: Request): Response | Promise<Response> =>
    server.fetch(request);
  return {
    server,
    application,
    publicBasePath: application.publicBasePath,
    fetch,
    database,
    connection: database.connection(),
    config,
    request: async (target, init) =>
      fetch(
        new Request(
          target.startsWith('/') ? `${apiRoot}${target}` : target,
          init,
        ),
      ),
    close: async () => {
      try {
        await server.close();
      } finally {
        await config.dispose();
      }
    },
  };
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import authentication from '@nocobase/app-plugin-authentication/server';
import authorization, {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization/server';
import authorizationExample from '@nocobase/app-plugin-authorization-example/server';
import defaultAccessPlugin, {
  defaultAccess,
} from '@nocobase/app-plugin-authz-default-access/server';
import restrictionRulesPlugin, {
  restrictionRules,
} from '@nocobase/app-plugin-authz-restriction-rules/server';
import sharingRulesPlugin, {
  sharingRules,
} from '@nocobase/app-plugin-authz-sharing-rules/server';
import { Application } from '@nocobase/app-server/application';
import { CachingProvider } from '@nocobase/app-server/caching';
import {
  createAppPaths,
  type AppConfigAccessor,
} from '@nocobase/app-server/config';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { LoggingProvider } from '@nocobase/app-server/logging';
import {
  defineServerPlugins,
  resolveAppServerPlugins,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import { SessionProvider } from '@nocobase/app-server/session';
import { createDefaultCachingConfig } from '@nocobase/caching';
import {
  databaseManagerToken,
  type AnyConnectionConfig,
  type DatabaseManager,
} from '@nocobase/db';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/db-testing';
import { createSilentLoggingConfig } from '@nocobase/logging';
import { createNullSessionConfig } from '@nocobase/session';

import {
  definePermissionSet,
  type PermissionSet,
} from '@nocobase/authorization/permission-sets';

import departments, { DEPARTMENTS_SETTINGS } from '../server/index.js';
import {
  organizationServiceToken,
  type OrganizationService,
} from '../server/tokens.js';

export const ADMIN = { email: 'admin@nocobase.com', password: 'admin123' };
const ORIGIN = 'http://localhost';

export interface TestApp {
  readonly app: Application;
  readonly authz: AppAuthorization;
  readonly database: DatabaseManager;
  readonly organization: OrganizationService;
  request(
    method: string,
    pathname: string,
    options?: { cookie?: string; json?: unknown },
  ): Promise<Response>;
  /** Creates an account through sign-up and returns its id and session cookie. */
  signUp(name: string): Promise<TestUser>;
  signIn(email: string, password: string): Promise<string>;
  readonly directory: string;
  /**
   * Stops the application and removes its directory and the database it provisioned; `keep` leaves both for a
   * restart on the same directory and connection.
   */
  close(options?: { keep?: boolean }): Promise<void>;
}

export interface TestUser {
  readonly id: string;
  readonly email: string;
  readonly cookie: string;
}

function cookieOf(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

export interface CreateTestAppOptions {
  /** The application's root directory; a new temporary one when omitted. */
  readonly directory?: string;
  /** `false` leaves the optional rule plugins out entirely. */
  readonly rules?: boolean;
  /**
   * The database to run on, owned by the caller. When omitted the application gets an empty database of its own on
   * the dialect `NOCOBASE_TEST_DB_DIALECT` selects, dropped again by `close()`.
   */
  readonly connection?: AnyConnectionConfig;
}

/**
 * A real application: authentication, authorization with the three rule plugins, the authorization example this
 * plugin builds on, and this plugin, on a fresh database. Startup runs every plugin's migrations and seeds,
 * exactly as an installing application does.
 */
export async function createTestApp(
  options: CreateTestAppOptions = {},
): Promise<TestApp> {
  const rules = options.rules ?? true;
  const directory =
    options.directory ??
    mkdtempSync(path.join(tmpdir(), 'departments-example-'));
  let databases: ProvisionedTestDatabases | undefined;
  let connection = options.connection;
  if (!connection) {
    databases = await provisionTestDatabases();
    connection = databases.connectionConfig();
  }
  const values: Record<string, unknown> = {
    app: {
      name: 'main',
      publicOrigin: ORIGIN,
      publicBasePath: '/',
      internalBasePath: '',
      publicApiUrl: '/api',
    },
    auth: {
      secret: 'departments-example-test-secret-at-least-32-characters',
      baseURL: ORIGIN,
      emailAndPassword: { enabled: true, autoSignIn: false },
      session: { storeSessionInDatabase: true },
    },
    authorization: {
      permissionSets: { rootSet: 'root', defaultSet: 'member' },
      plugins: rules
        ? [defaultAccess(), sharingRules(), restrictionRules()]
        : [],
    },
    caching: createDefaultCachingConfig(),
    database: {
      default: 'main',
      connections: { main: { ...connection, schemaManagement: 'managed' } },
    },
    logging: createSilentLoggingConfig(),
    session: createNullSessionConfig(),
    snowflake: { workerId: 0 },
  };
  const config: AppConfigAccessor = {
    get: <TValue>(key: string): TValue => values[key] as TValue,
    raw: () => values,
    reload: () => Promise.resolve({ changedNamespaces: [] }),
    subscribe: () => () => undefined,
  };
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: directory }),
  });
  app.addServiceProvider(LoggingProvider);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addServiceProvider(SessionProvider);
  app.addServerPlugins(
    resolveAppServerPlugins(
      directory,
      defineServerPlugins([
        authentication,
        authorization,
        ...(rules
          ? [defaultAccessPlugin, sharingRulesPlugin, restrictionRulesPlugin]
          : []),
        authorizationExample,
        departments,
      ] as readonly AppServerPlugin[]),
    ),
  );
  try {
    await app.start();
  } catch (error) {
    await app.shutdown().catch(() => undefined);
    await databases?.drop();
    if (!options.directory) rmSync(directory, { recursive: true, force: true });
    throw error;
  }

  async function request(
    method: string,
    pathname: string,
    options: { cookie?: string; json?: unknown } = {},
  ): Promise<Response> {
    const headers = new Headers({ origin: ORIGIN });
    if (options.cookie) headers.set('cookie', options.cookie);
    if (options.json !== undefined)
      headers.set('content-type', 'application/json');
    return app.fetch(
      new Request(new URL(pathname, ORIGIN), {
        method,
        headers,
        ...(options.json === undefined
          ? {}
          : { body: JSON.stringify(options.json) }),
      }),
    );
  }

  async function signIn(email: string, password: string): Promise<string> {
    const response = await request('POST', '/api/auth/sign-in/email', {
      json: { email, password },
    });
    if (!response.ok)
      throw new Error(
        `Sign-in failed: ${response.status} ${await response.text()}`,
      );
    return cookieOf(response);
  }

  let sequence = 0;
  async function signUp(name: string): Promise<TestUser> {
    sequence += 1;
    const email = `${name.toLowerCase()}-${sequence}@example.test`;
    const password = 'test-password-123';
    const response = await request('POST', '/api/auth/sign-up/email', {
      json: { name, email, password },
    });
    if (!response.ok)
      throw new Error(
        `Sign-up failed: ${response.status} ${await response.text()}`,
      );
    const body = (await response.json()) as { user: { id: string } };
    return { id: body.user.id, email, cookie: await signIn(email, password) };
  }

  return {
    app,
    authz: app.container.resolve(authorizationToken),
    database: app.container.resolve(databaseManagerToken),
    organization: app.container.resolve(organizationServiceToken),
    request,
    signUp,
    signIn,
    directory,
    async close({ keep = false } = {}) {
      try {
        await app.shutdown();
      } finally {
        if (!keep) {
          await databases?.drop();
          rmSync(directory, { recursive: true, force: true });
        }
      }
    },
  };
}

/** The authorization example's sets this plugin assigns. */
export const SALES_SETS = {
  assistant: 'example-sales-assistant',
  engineer: 'example-sales-engineer',
  manager: 'example-sales-manager',
  delivery: 'example-sales-delivery',
} as const;

/** A permission set holding the Departments settings item with the given actions. */
export function departmentsSettingsSet(
  authz: AppAuthorization,
  key: string,
  actions: readonly ('read' | 'update')[],
): PermissionSet {
  return definePermissionSet(key)
    .grant(authz.settings.grant(DEPARTMENTS_SETTINGS, actions))
    .build();
}

/** Creates departments in order; each entry is `[id, parentId, region?]`, titled after its id. */
export async function createTree(
  organization: OrganizationService,
  entries: readonly (readonly [string, string | null, string?])[],
): Promise<void> {
  for (const [id, parentId, region] of entries)
    await organization.createDepartment({
      id,
      title: `Dept ${id}`,
      parentId,
      ...(region === undefined ? {} : { region }),
    });
}

export type SalesList = 'projects' | 'quotes' | 'orders';

/** What a sales list of the authorization example answers a session: its status and the record ids it lists. */
export async function readSales(
  test: TestApp,
  cookie: string,
  list: SalesList = 'projects',
): Promise<{ status: number; ids: string[] }> {
  const response = await test.request(
    'GET',
    `/api/authorization-example/sales/${list}`,
    { cookie },
  );
  if (response.status !== 200) return { status: response.status, ids: [] };
  const body = (await response.json()) as { data: { items: { id: string }[] } };
  return { status: 200, ids: body.data.items.map((row) => row.id).sort() };
}

/** The sales region the authorization example reads for a user, or `undefined` when it has none. */
export async function salesRegion(
  test: TestApp,
  userId: string,
): Promise<string | undefined> {
  const row = await test.database
    .connection()
    .query.selectFrom('authorizationExampleSalesMembers')
    .select('region')
    .where('id', '=', userId)
    .executeTakeFirst();
  return row ? String(row.region) : undefined;
}

/** Page access to the three sales pages, and `view` on each composite with its data scope set to `scope`. */
export function salesViewSet(
  key: string,
  scope: string | { type: 'recordAccess'; key: string; params?: unknown },
): PermissionSet {
  const view = (composite: string, scopeKey: string) => ({
    resource: { type: 'composite', id: composite },
    actions: [
      {
        action: 'view',
        policy: { type: 'composite' as const, scopes: { [scopeKey]: scope } },
      },
    ],
  });
  return definePermissionSet(key)
    .grant(
      ...['projects', 'quotes', 'orders'].map((page) => ({
        resource: { type: 'page', id: `example.sales.${page}` },
        actions: [{ action: 'access' }],
      })),
      view('example.sales.projects', 'projects'),
      view('example.sales.quotes', 'quotes'),
      view('example.sales.orders', 'orders'),
    )
    .build();
}

/** Writes a project owned by `ownerId`, with one quote it prepared and one order, all ids derived from `id`. */
export async function createProject(
  test: TestApp,
  id: string,
  ownerId: string,
): Promise<void> {
  const query = test.database.connection().query;
  await query
    .insertInto('authorizationExampleProjects')
    .values({
      id,
      title: `Project ${id}`,
      region: 'North',
      ownerId,
      confidential: false,
      notes: 'Test',
    })
    .execute();
  await query
    .insertInto('authorizationExampleQuotes')
    .values({
      id: `${id}-quote`,
      projectId: id,
      preparedById: ownerId,
      preparedByName: 'Owner',
      title: `Quote ${id}`,
      notes: 'Test',
      amount: 1000,
      status: 'draft',
    })
    .execute();
  await query
    .insertInto('authorizationExampleOrders')
    .values({
      id: `${id}-order`,
      projectId: id,
      quoteId: `${id}-quote`,
      title: `Order ${id}`,
      status: 'ready',
      deliveryReference: null,
    })
    .execute();
}

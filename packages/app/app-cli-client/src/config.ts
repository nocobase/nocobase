// What makes the client an application's CLI: its command name, where it keeps state, and which file a run's
// credentials are in. `runAppCli` takes one of these; everything else in src/client/ reads it through `appCliConfig()`.
import os from 'node:os';
import path from 'node:path';

import { CLI_ROUTES } from '@nocobase/agent-protocol';

export interface AppCliConfig {
  /** The command name, such as `acme`. */
  readonly bin: string;
  /** The application's name in messages, such as `Acme`. */
  readonly displayName: string;
  /** The directory under the home directory the CLI keeps its state in, such as `.acme`. */
  readonly stateDir: string;
  /** An environment variable that moves the state directory, such as `ACME_HOME`; tests use it. */
  readonly homeEnv?: string;
  /**
   * Where a runner puts a run's credentials, relative to the run's working directory, such as `.acme/run.json`. The CLI
   * finds the nearest one at or above its working directory and then acts as the run.
   */
  readonly runCredentialsFile: string;
  /**
   * The keychain service the person's credential (the session `login` signed in, or an API key) is kept under; `cliKeychainService(bin)` by default, such as `acme-cli`,
   * which is also what a runner keeps agents away from.
   */
  readonly keychainService?: string;
  /** An environment variable whose value `off` turns the keychain off, such as `ACME_KEYCHAIN`; the credential then goes into `config.json`. */
  readonly keychainEnv?: string;
  /**
   * The prefix of the environment variables that act without signing in, such as `ACME` for `ACME_SERVER`,
   * `ACME_API_KEY` and `ACME_PROFILE`; none are read without one.
   */
  readonly envPrefix?: string;
  /**
   * Signing in through the browser (`<bin> login` without a key), when the server offers it: Better Auth's device
   * authorization (`deviceAuthorization()` and `bearer()` on the server).
   */
  readonly auth?: AppCliAuth;
  /** The manifest path relative to the server's address; `CLI_ROUTES.manifest` by default. */
  readonly manifestPath?: string;
  /** Shown as `acme login --server <example>`. */
  readonly exampleServer?: string;
  /** What `--version` prints; this package's own version when left out. */
  readonly version?: string;
  /** The root help's description. */
  readonly description?: string;
  /**
   * Asked, as the signed-in person, after `login` and after each business command's manifest fetch: a line saying a
   * newer CLI is available, printed on stderr once, or undefined. It should be quick and remember what it found;
   * whatever it throws is ignored.
   */
  readonly updateHint?: (session: AppCliSession) => Promise<string | undefined>;
  /**
   * How the CLI updates itself when the application's install script installed it: `<bin> update`, and the hint that a
   * newer version is served when `updateHint` is left out (`update.ts`). Without it the CLI has no `update`.
   */
  readonly selfUpdate?: AppCliSelfUpdate;
}

/** What `<bin> update` needs to know of the CLI's own installation. */
export interface AppCliSelfUpdate {
  /**
   * The root of the CLI's package as it runs, which is `<prefix>/versions/<version>` when the install script installed
   * it (`install.ts`).
   */
  readonly packageRoot: string;
  /** The product the application serves the CLI as (`DIST_ROUTES.resolve`); `bin` by default. */
  readonly product?: string;
}

/** Where the signed-in person's requests go, and the headers that authenticate them. */
export interface AppCliSession {
  /** As configured: `https://host/app`. */
  readonly server: string;
  readonly headers: Readonly<Record<string, string>>;
}

/** The client id a CLI sends when its configuration names none. */
export const DEFAULT_CLI_CLIENT_ID = 'nocobase-cli';

/** Better Auth's routes below the server's address, unless the configuration names others. */
export const DEFAULT_AUTH_BASE_PATH = '/api/auth';

/**
 * How the CLI signs in through the browser (RFC 8628, Better Auth's `deviceAuthorization()`): it asks
 * `<basePath>/device/code` for a code, the person approves it on the page the server names, and
 * `<basePath>/device/token` answers a session token the CLI then sends as `Authorization: Bearer`; `logout` signs that
 * session out (`<basePath>/sign-out`).
 */
export interface AppCliAuth {
  /** The client id the server's `validateClient` accepts, such as `acme`; `DEFAULT_CLI_CLIENT_ID` when left out. */
  readonly clientId?: string;
  /** Better Auth's routes, relative to the server's address; `DEFAULT_AUTH_BASE_PATH` when left out. */
  readonly basePath?: string;
}

/** The client id of `auth`. */
export function cliClientIdOf(auth: AppCliAuth): string {
  return auth.clientId ?? DEFAULT_CLI_CLIENT_ID;
}

/** `route` below Better Auth's base path, such as `/api/auth/device/code`. */
export function authRouteOf(
  auth: AppCliAuth | undefined,
  route: string,
): string {
  return `${(auth?.basePath ?? DEFAULT_AUTH_BASE_PATH).replace(/\/+$/u, '')}${route}`;
}

let current: AppCliConfig | undefined;

export function configureAppCli(config: AppCliConfig): void {
  current = config;
}

export function appCliConfig(): AppCliConfig {
  if (current === undefined)
    throw new Error('The CLI was started without runAppCli().');
  return current;
}

export function manifestPathOf(config: AppCliConfig): string {
  return config.manifestPath ?? CLI_ROUTES.manifest;
}

export interface AppCliPaths {
  home: string;
  /** The signed-in user and where their key is kept (0600). */
  userConfig: string;
  /** Cached command manifests. */
  manifestCache: string;
}

export function appCliHome(
  config: AppCliConfig = appCliConfig(),
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configured =
    config.homeEnv === undefined ? undefined : env[config.homeEnv];
  return configured !== undefined && configured !== ''
    ? path.resolve(configured)
    : path.join(os.homedir(), config.stateDir);
}

export function appCliPaths(home: string = appCliHome()): AppCliPaths {
  return {
    home,
    userConfig: path.join(home, 'config.json'),
    manifestCache: path.join(home, 'cache', 'manifests'),
  };
}

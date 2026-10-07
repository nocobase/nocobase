// Who the business commands act as, and where they go. Inside a run's working directory the CLI is the run (the token
// in the run's credentials file); anywhere else it is the user who signed in. Command and manifest paths are relative
// to the server's origin (they already include any base path the application is served under).
import { HEADERS } from '@nocobase/agent-protocol';

import {
  appCliConfig,
  appCliPaths,
  manifestPathOf,
  type AppCliConfig,
  type AppCliPaths,
} from '../config.ts';
import {
  credentialHeaders,
  findRunCredentials,
  peekUserConfig,
  readRunCredentials,
  readUserConfig,
} from '../lib/credentials.ts';
import { globalFlags } from '../lib/globals.ts';

export interface Session {
  readonly kind: 'run' | 'user';
  /** As configured: `https://host/app`. */
  readonly server: string;
  readonly headers: Readonly<Record<string, string>>;
  /** Where the manifest is, relative to the origin. */
  readonly manifestPath: string;
  /** Separates cached manifests: one per run, one for the user. */
  readonly cacheKey: string;
}

/** `path` (origin-relative, or relative to the server when it has no leading slash) as a URL. */
export function urlFor(server: string, path: string): URL {
  const base = new URL(server.endsWith('/') ? server : `${server}/`);
  return path.startsWith('/')
    ? new URL(path, base.origin)
    : new URL(path, base);
}

/** A route of the server (`/api/...`) below the base path its address has, such as `/app/api/...`. */
export function serverPath(server: string, route: string): string {
  const base = new URL(server).pathname.replace(/\/+$/u, '');
  return `${base}${route.startsWith('/') ? '' : '/'}${route}`;
}

/** The manifest path the server would give for a server address with a base path. */
function defaultManifestPath(server: string, config: AppCliConfig): string {
  return serverPath(server, manifestPathOf(config));
}

/** The session for `cwd`, or undefined when the CLI is neither in a run nor signed in. */
export async function currentSession(
  cwd: string = process.cwd(),
  paths: AppCliPaths = appCliPaths(),
  config: AppCliConfig = appCliConfig(),
): Promise<Session | undefined> {
  const runFile = findRunCredentials(cwd, config);
  if (runFile !== undefined) {
    const run = await readRunCredentials(runFile);
    return {
      kind: 'run',
      server: run.server,
      headers: { [HEADERS.runToken]: run.token },
      manifestPath: run.manifestUrl || defaultManifestPath(run.server, config),
      cacheKey: `run-${run.runId}`,
    };
  }
  const user = await readUserConfig({
    paths,
    config,
    profile: globalFlags().profile,
  });
  if (user === undefined) return undefined;
  return {
    kind: 'user',
    server: user.server,
    headers: credentialHeaders(user),
    manifestPath: defaultManifestPath(user.server, config),
    cacheKey: `user:${user.profile ?? 'env'}`,
  };
}

/** Where the session's manifest is cached, found without reading any key: what completion reads. */
export async function peekSession(
  cwd: string = process.cwd(),
  paths: AppCliPaths = appCliPaths(),
  config: AppCliConfig = appCliConfig(),
): Promise<Pick<Session, 'server' | 'cacheKey'> | undefined> {
  const runFile = findRunCredentials(cwd, config);
  if (runFile !== undefined) {
    const run = await readRunCredentials(runFile).catch(() => undefined);
    return run
      ? { server: run.server, cacheKey: `run-${run.runId}` }
      : undefined;
  }
  const user = await peekUserConfig({
    paths,
    config,
    profile: globalFlags().profile,
  });
  return user
    ? { server: user.server, cacheKey: `user:${user.profile ?? 'env'}` }
    : undefined;
}

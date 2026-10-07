/**
 * A small application around a test's own `/api` routes: their API document, the command manifest derived from it with
 * the plugin's CLI surface (a run by its token, a person by `authenticatePerson`), and an online run's commands from
 * that manifest, dispatched through the application.
 */
import { HEADERS } from '@nocobase/agent-protocol';
import type { Auth, AuthSession } from '@nocobase/app-plugin-authentication';
import {
  ApiDocsService,
  CliService,
  createCliRouter,
  type CliManifest,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';

import {
  runCredentialResolver,
  runIdentityOf,
} from '../server/cli/run-credential.js';
import { bindCliSurface, type CliSurface } from '../server/cli/surface.js';
import type { Agents } from '../server/composition.js';
import type { CallerIdentity } from '../server/core/callers/index.js';
import type { CommandSurface } from '../server/online/index.js';

/** The security of a route a person (by API key) or a run may call. */
export const personOrRun: Record<string, string[]>[] = [
  { apiKeyAuth: [] },
  { runToken: [] },
];

type Services = Pick<Agents, 'runs' | 'tx' | 'gate'>;

/** The run a request's token names; undefined without one. */
export async function runOf(
  services: Services,
  headers: Headers,
): Promise<CallerIdentity | undefined> {
  if (!headers.get(HEADERS.runToken)) return undefined;
  const credential = await runCredentialResolver(services)(headers);
  return runIdentityOf({ credential } as unknown as AuthSession);
}

/**
 * Lets a run through when it holds `action` now, setting `caller` to the person who woke its agent, as an application
 * bounds a run's requests; 401 without a run, 403 `FORBIDDEN` without the action.
 */
export function runGuard(
  services: Services,
  action?: string,
): MiddlewareHandler {
  return async (context, next) => {
    const identity = await runOf(services, context.req.raw.headers);
    if (!identity)
      return context.json(
        {
          error: {
            code: 401,
            status: 'UNAUTHENTICATED',
            reason: 'UNAUTHORIZED',
            domain: 'test',
            message: 'No run.',
          },
        },
        401,
      );
    if (action && !(await services.gate.allowed(identity)).has(action))
      return context.json(
        {
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            reason: 'FORBIDDEN',
            domain: 'test',
            message: `Needs ${action}.`,
          },
        },
        403,
      );
    context.set('caller' as never, { userId: identity.userId } as never);
    await next();
  };
}

export interface CliApp {
  /** The routes under `/api`, and `GET /api/cli/manifest`. */
  readonly app: Hono;
  readonly cli: CliService;
  readonly surface: CliSurface;
  manifestFor(identity: CallerIdentity): Promise<CliManifest>;
  /** An online run's commands, as the application builds them (`AgentsDeps.commandsOf`). */
  commandsOf(identity: CallerIdentity, token: string): Promise<CommandSurface>;
}

/** `api` holds the routes as mounted under `/api`. */
export function createCliApp(
  services: Services,
  api: Hono,
  options: { readonly authenticatePerson?: MiddlewareHandler } = {},
): CliApp {
  const auth = {
    getSession: async (headers: Headers) => {
      const credential = await runCredentialResolver(services)(headers);
      return credential ? { credential } : null;
    },
  } as unknown as Auth;
  const docs = new ApiDocsService();
  docs.attach({
    api,
    describe: () => ({ info: { title: 'Test', version: '0.0.0' } }),
  });
  const cli = new CliService();
  const surface = bindCliSurface({
    cli,
    auth: () => auth,
    authenticatePerson:
      options.authenticatePerson ??
      ((context) => Promise.resolve(context.json({}, 401))),
    gate: services.gate,
  });
  const app = new Hono();
  app.route('/api', api);
  app.route('/api', createCliRouter(cli, docs));
  const manifestFor = async (identity: CallerIdentity) =>
    cli.manifestFor(await docs.getDocument(), await surface.callerOf(identity));
  return {
    app,
    cli,
    surface,
    manifestFor,
    commandsOf: async (identity, token) => ({
      bin: 'acme',
      commands: (await manifestFor(identity)).commands,
      send: (request) =>
        Promise.resolve(
          app.fetch(
            new Request(`http://application${request.path}`, {
              method: request.method,
              headers: {
                [HEADERS.runToken]: token,
                accept: 'application/json',
                ...(request.body === undefined
                  ? {}
                  : { 'content-type': 'application/json' }),
              },
              ...(request.body === undefined ? {} : { body: request.body }),
            }),
          ),
        ),
    }),
  };
}

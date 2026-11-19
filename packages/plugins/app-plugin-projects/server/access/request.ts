/**
 * The request side of access: after authentication and the authorization middleware, `viewerMiddleware` builds the
 * request's `Viewer` and route handlers read it with `viewerOf`.
 */
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import type { Context, MiddlewareHandler } from 'hono';

import type { ActorVia } from '../kernel/actor.js';
import type { ProjectsAccess, RequestActor } from '../tokens.js';
import { DomainError } from '../kernel/errors.js';
import type { Viewer } from './viewer.js';

const VIEWER = 'pmViewer';

export interface ViewerEnv {
  Variables: AuthEnv['Variables'] &
    AuthorizationEnv['Variables'] & {
      [VIEWER]?: Viewer;
    };
}

export interface ViewerHooks {
  readonly actorOf?: () => RequestActor | undefined;
}

/** The header the CLI's user mode sends: `nocoproject-cli/<version>`. */
const CLIENT_HEADER = 'x-pm-client';
const CLI_PREFIX = 'nocoproject-cli/';

/** How an API-key request arrived (browsers never send a key). */
function requestVia(context: Context): ActorVia | undefined {
  if (!context.req.header('x-api-key')) return undefined;
  return (context.req.header(CLIENT_HEADER) ?? '').startsWith(CLI_PREFIX)
    ? 'cli'
    : 'api_key';
}

/** Builds the request's `Viewer`; install after `auth.required()` and `authz.middleware()`. */
export function viewerMiddleware(
  access: Pick<ProjectsAccess, 'permissionsOf'>,
  hooks: ViewerHooks = {},
): MiddlewareHandler<ViewerEnv> {
  return async (context, next) => {
    const auth = context.get('auth');
    if (!auth)
      throw new DomainError('unauthorized', 'UNAUTHORIZED', 'Sign in first.');
    const userId = auth.user.id;
    const via = requestVia(context);
    const identity = context.get('authz').identity;
    const projects = identity.keyScope?.objects('pm.projects') ?? 'all';
    const acting = await hooks.actorOf?.()?.(context);
    context.set(VIEWER, {
      userId,
      ...(auth.credential?.type === 'run' ? { runId: auth.credential.id } : {}),
      actor: acting ?? { type: 'user', id: userId, ...(via ? { via } : {}) },
      permissions: await access.permissionsOf(identity),
      ...(projects === 'all' ? {} : { projectIds: projects }),
    });
    await next();
  };
}

export function viewerOf(context: Context<ViewerEnv>): Viewer {
  const viewer = context.get(VIEWER);
  if (!viewer)
    throw new DomainError('unauthorized', 'UNAUTHORIZED', 'Sign in first.');
  return viewer;
}

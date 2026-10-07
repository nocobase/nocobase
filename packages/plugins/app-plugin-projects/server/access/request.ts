/**
 * The request side of access: after authentication and the authorization middleware, `viewerMiddleware` builds the
 * request's `Viewer` and route handlers read it with `viewerOf`.
 */
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import type { Context, MiddlewareHandler } from 'hono';

import type { ActorVia } from '../kernel/actor.js';
import type {
  DelegatedWrite,
  DelegatedWriteRequest,
  DelegatedWrites,
  ProjectsAccess,
  RequestActor,
} from '../tokens.js';
import { conflict, DomainError } from '../kernel/errors.js';
import type { Viewer } from './viewer.js';

const VIEWER = 'pmViewer';
const DELEGATED = 'pmDelegatedWrites';

export interface ViewerEnv {
  Variables: AuthEnv['Variables'] &
    AuthorizationEnv['Variables'] & {
      [VIEWER]?: Viewer;
      [DELEGATED]?: DelegatedWrites;
    };
}

/** What the application binds, resolved on each request (`projectsRequestActorToken`, `projectsDelegatedWritesToken`). */
export interface ViewerHooks {
  readonly actorOf?: () => RequestActor | undefined;
  readonly delegated?: () => DelegatedWrites | undefined;
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
    const delegated = hooks.delegated?.();
    if (delegated) context.set(DELEGATED, delegated);
    context.set(VIEWER, {
      userId,
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

/**
 * Hands a write to the application's delegated writes when the request's viewer acts for someone else
 * (`DelegatedWrites`); undefined when it does not, and the route then writes through the services itself.
 */
export async function delegatedWrite(
  context: Context<ViewerEnv>,
  request: DelegatedWriteRequest,
): Promise<DelegatedWrite | undefined> {
  const writes = context.get(DELEGATED);
  const viewer = viewerOf(context);
  return writes?.covers(viewer) ? writes.write(viewer, request) : undefined;
}

/**
 * Refuses a change made for someone else (a conversation's run acting for its asker) that the delegated writes do not
 * cover, such as deleting an issue: 409 `PLAN_REQUIRED`, so it goes through a plan the person confirms.
 */
export function refuseDelegated(context: Context<ViewerEnv>): void {
  const writes = context.get(DELEGATED);
  if (writes?.covers(viewerOf(context)))
    throw conflict(
      'PLAN_REQUIRED',
      'A conversation makes this change through a plan the person confirms; propose one.',
    );
}

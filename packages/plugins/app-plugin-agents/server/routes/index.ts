/**
 * The plugin's HTTP API, under `/api/agents`. Every route carries its own authentication, because the paths of
 * different callers share the one namespace:
 *
 * - people, by session: agents, skills, variables, runs, conversations, model services, prices, usage and runners
 *   (`admin.ts`, `chat.ts`, `online/routes.ts`, `runners/admin.ts`). Scoped API keys reach only the routes whose every
 *   operation is a settings check through `authz.can` (agents, skills, model services, prices and usage); everything
 *   else has a personal fallback a key's scope could not bound.
 * - a run, by its run token: `/agents/runs/current` (`run.ts`).
 * - a person or a run: `/agents/available`, the agents the caller may give work to (`roster.ts`).
 * - runners, by key: the runner protocol under `/agents/runners` (`runners/runner.ts`).
 * - the tarballs, by runner key, registration token, download token or session: `/agents/dist` (`runners/dist.ts`),
 *   where a person mints download tokens; the install script, `/agents/dist/installScript`, needs no credential.
 *
 * Fixed segments are registered before `/agents/:agentId` (agent ids are generated, never chosen).
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { every } from 'hono/combine';

import { agentsAccessToken, agentsToken } from '../tokens.js';
import { createAdminRoutes, type AdminEnv } from './admin.js';
import { createChatRoutes } from './chat.js';
import { createModelRoutes } from '../online/routes.js';
import { createRosterRoutes } from './roster.js';
import { createRunRoutes } from './run.js';
import {
  createAdminRoutes as createRunnersAdminRoutes,
  type AdminEnv as RunnersAdminEnv,
} from './runners/admin.js';
import { createDistRoutes } from './runners/dist.js';
import { createInstallRoutes } from './runners/install.js';
import { createRunnerRoutes } from './runners/runner.js';
import { runIdentityOf } from '../cli/run-credential.js';
import { ProtocolError } from '../kernel/errors.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const { container } = app;
    const services = container.resolve(agentsToken);
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);

    type GuardEnv = AdminEnv & {
      Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
    };
    const caller: MiddlewareHandler<GuardEnv> = async (context, next) => {
      const auth = context.get('auth');
      if (!auth) throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
      const authz = context.get('authz');
      const run = runIdentityOf(auth)?.run?.run;
      context.set('caller', {
        userId: auth.user.id,
        run: run
          ? { subjectKind: run.subjectKind, subjectId: run.subjectId }
          : null,
        can: (item, action) =>
          authz.can({ resource: { type: 'settings', id: item }, action }),
        opens: (page) =>
          authz.can({ resource: { type: 'page', id: page }, action: 'access' }),
        // Business levels come from the application's roles; without them, every level is none.
        scope: (key) =>
          container.has(agentsAccessToken)
            ? container.resolve(agentsAccessToken).scopeOf(authz.identity, key)
            : Promise.resolve('none'),
      });
      await next();
    };
    const guard = (scopedKeys: boolean): MiddlewareHandler<AdminEnv> =>
      every(
        authentication.required({ scopedKeys }),
        authorization.middleware(),
        caller,
      );
    // A person; scoped API keys and service-account keys are refused (`SCOPED_KEY_FORBIDDEN`).
    const person = guard(false);
    // A person, or a scoped key: only where every operation is a settings check the key's scope narrows.
    const personOrScopedKey = guard(true);
    // A person, or a run by its token (`caller.run`); other scoped keys are refused, as by `person`.
    const personOrRun: MiddlewareHandler<AdminEnv> = every(
      authentication.required({ scopedKeys: true }),
      (async (context, next) => {
        const auth = context.get('auth');
        if (
          auth &&
          !runIdentityOf(auth) &&
          (await authentication.isScopedSession(auth, context.req.raw))
        )
          throw new ProtocolError(
            'SCOPED_KEY_FORBIDDEN',
            'This endpoint does not accept scoped API keys or service-account keys.',
          );
        await next();
      }) as MiddlewareHandler<GuardEnv>,
      authorization.middleware(),
      caller,
    );

    const router = new Hono();
    router.route(
      '/agents/dist',
      createInstallRoutes({
        cli: () => services.cli.name,
        publicBasePath: app.publicBasePath,
        publicOrigin: () =>
          app.config.get<{ publicOrigin?: string }>('app')?.publicOrigin,
      }),
    );
    router.route(
      '/agents/dist',
      createDistRoutes(services, {
        // Any key may download the CLI, so CI with an organization's key can install it before it signs in.
        authenticatePerson: authentication.required({
          scopedKeys: true,
        }) as MiddlewareHandler,
        person: person as unknown as MiddlewareHandler<RunnersAdminEnv>,
      }),
    );
    router.route('/agents/runners', createRunnerRoutes(services));
    router.route(
      '/agents/runners',
      createRunnersAdminRoutes(
        services,
        person as unknown as MiddlewareHandler<RunnersAdminEnv>,
      ),
    );
    router.route('/agents', createRunRoutes(services));
    router.route('/agents', createRosterRoutes(services, personOrScopedKey));
    router.route('/agents', createChatRoutes(services, person, personOrRun));
    router.route(
      '/agents',
      createModelRoutes(services, person, personOrScopedKey),
    );
    // Last: it holds `/agents/:agentId`.
    router.route(
      '/agents',
      createAdminRoutes(services, person, personOrScopedKey),
    );
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;

import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  executeIdempotentMutation,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';
import { SkillProjectsService } from '../providers/skill-projects.js';

const Project = z.object({ id: z.string(), name: z.string() });
const Input = z.strictObject({ name: z.string().trim().min(1).max(100) });
const Params = z.object({ id: z.string().uuid() });
const Header = z.object({ 'idempotency-key': z.string() });
const access = {
  resource: { type: 'page', id: 'skill-projects' },
  action: 'access',
} as const;

// The page grant manages this learning dataset; no role receives it automatically.
export const skillProjectsRoutes = defineApiRoutes(async (app: Application) => {
  const router = new Hono<AuthEnv & AuthorizationEnv>();
  router.onError(apiErrorHandler);
  if (!app.container.has(databaseManagerToken)) {
    router.all('*', describeRoute({ hide: true }), (c) =>
      apiErrorHandler(
        new ApiError({
          status: 'UNAVAILABLE',
          reason: 'DATABASE_UNAVAILABLE',
          domain: 'examples',
          message: 'The database is unavailable.',
        }),
        c,
      ),
    );
    return new Hono().route('/skillProjects', router);
  }
  const connection = app.container.resolve(databaseManagerToken).connection();
  const service = new SkillProjectsService(connection);
  router.use(
    '*',
    app.container.resolve(authenticationToken).required({ scopedKeys: false }),
    app.container.resolve(authorizationToken).middleware(),
    async (c, next) => {
      await c.get('authz').require(access);
      await next();
    },
  );
  router.get(
    '/',
    describeRoute({
      tags: ['Examples'],
      operationId: 'skillProjectsList',
      summary: 'List projects',
      description:
        'Requires skill-projects page access. Returns at most 100 records with a total count.',
      responses: { 200: listResponse(Project), ...apiErrorResponses },
    }),
    async (c) => c.json(await service.list()),
  );
  router.get(
    '/:id',
    describeRoute({
      tags: ['Examples'],
      operationId: 'skillProjectsGet',
      summary: 'Read a project',
      responses: { 200: dataResponse(Project), ...apiErrorResponses },
    }),
    apiValidator('param', Params),
    async (c) => c.json({ data: await service.get(c.req.valid('param').id) }),
  );
  router.post(
    '/',
    describeRoute({
      tags: ['Examples'],
      operationId: 'skillProjectsCreate',
      summary: 'Create a project',
      description:
        'Requires page access and an Idempotency-Key. Commits the record and receipt atomically.',
      responses: { 200: dataResponse(Project), ...apiErrorResponses },
    }),
    apiValidator('header', Header),
    apiValidator('json', Input),
    async (c) => {
      const result = await executeIdempotentMutation({
        connection,
        key: c.req.valid('header')['idempotency-key'],
        principal: `${app.appName}:${c.get('auth')!.user.id}`,
        operation: 'skillProjects/create',
        input: c.req.valid('json'),
        authorize: async () => {
          await c.get('authz').require(access);
        },
        authorizeReplay: async () => {
          await c.get('authz').require(access);
        },
        execute: (transaction) =>
          new SkillProjectsService(transaction).save(c.req.valid('json')),
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  router.patch(
    '/:id',
    describeRoute({
      tags: ['Examples'],
      operationId: 'skillProjectsUpdate',
      summary: 'Rename a project',
      description:
        'Requires page access and an Idempotency-Key. Commits the record and receipt atomically.',
      responses: { 200: dataResponse(Project), ...apiErrorResponses },
    }),
    apiValidator('param', Params),
    apiValidator('header', Header),
    apiValidator('json', Input),
    async (c) => {
      const id = c.req.valid('param').id;
      const result = await executeIdempotentMutation({
        connection,
        key: c.req.valid('header')['idempotency-key'],
        principal: `${app.appName}:${c.get('auth')!.user.id}`,
        operation: `skillProjects/${id}/update`,
        input: c.req.valid('json'),
        authorize: async () => {
          await c.get('authz').require(access);
        },
        authorizeReplay: async () => {
          await c.get('authz').require(access);
          await service.get(id);
        },
        execute: (transaction) =>
          new SkillProjectsService(transaction).save(c.req.valid('json'), id),
      });
      c.header('Idempotency-Replayed', String(result.replayed));
      return c.json({ data: result.data });
    },
  );
  return new Hono().route('/skillProjects', router);
});

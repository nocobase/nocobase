import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  defineRepositoryApiRoutes,
  parseApiInput,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { PROJECTS } from '../sales-authorization.js';
import { projectReference } from '../sales-resources.js';
import { AUTHORIZATION_EXAMPLE_DOMAIN } from './mutations.js';
import { ProjectUpdateInput } from './schemas.js';

const repositoryRoutes = defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'salesProjects',
      collection: PROJECTS,
      policy: {
        read: {
          scope: true,
          fields: ['id', 'title', 'region', 'ownerId', 'confidential', 'notes'],
        },
        update: { scope: true, fields: ['title', 'notes'] },
        create: false,
        delete: false,
      },
      actions: {
        findMany: { maxLimit: 100 },
        findOne: {},
        count: {},
        updateOne: {},
      },
    },
  ],
});

/** Composed only under the example's authenticated route boundary. */
export async function createProjectRoutes(
  app: AppPluginApplication,
): Promise<Hono<AuthorizationEnv>> {
  const authz = app.container.resolve(authorizationToken);
  const router = new Hono<AuthorizationEnv>();

  router.use(
    '*',
    authz.database.authorizeRepository({
      repository: 'salesProjects',
      resource: projectReference,
      actions: {
        findMany: 'view',
        findOne: 'view',
        count: 'view',
        updateOne: 'edit',
      },
    }),
  );

  // The generated route validates the Repository input itself; this adds the business rule that only a project's
  // title and notes are editable, as typed text. It reads a clone, leaving the original stream for the Repository's
  // body limit and parser.
  router.use('/salesProjects/updateOne', async (c, next) => {
    const body: unknown = await c.req.raw
      .clone()
      .json()
      .catch(() => {
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_INPUT',
          domain: AUTHORIZATION_EXAMPLE_DOMAIN,
          message: 'The request body is not valid JSON.',
        });
      });
    parseApiInput(ProjectUpdateInput, body);
    await next();
  });

  router.route('/', await repositoryRoutes.createRouter(app));
  return router;
}

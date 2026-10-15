import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { projectsToken } from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { callerOfRequest } from '../agents/run-principal.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import {
  ProjectDefaultSkillsSchema,
  readProjectDefaultSkills,
  writeProjectDefaultSkills,
} from './default-skills.js';

export const projectDefaultSkillsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(agentsToken) ||
      !container.has(projectsToken)
    )
      return new Hono();
    const router = new Hono<AuthorizationEnv>();
    const projects = container.resolve(projectsToken);
    const skills = container.resolve(agentsToken).skills;
    router.onError(studioErrorHandler);
    router.use(
      '*',
      container.resolve(authenticationToken).required({ scopedKeys: true }),
    );
    router.use('*', container.resolve(authorizationToken).middleware());
    router.use('*', async (context, next) => {
      const identity = callerOfRequest(context as unknown as Context);
      if (!identity || identity.kind !== 'user')
        throw studioError(
          'PERMISSION_DENIED',
          'ACTION_FORBIDDEN',
          'This action is not allowed.',
        );
      const authz = context.get('authz');
      const resource = { type: 'settings', id: 'agents.agents' } as const;
      const manage = await authz.can({ resource, action: 'manage' });
      if (
        !manage &&
        (context.req.method !== 'GET' ||
          !(await authz.can({ resource, action: 'read' })))
      )
        throw studioError(
          'PERMISSION_DENIED',
          'ACTION_FORBIDDEN',
          'This needs agents.agents management permission.',
        );
      await next();
    });
    const security: Record<string, string[]>[] = [
      { cookieAuth: [] },
      { apiKeyAuth: [] },
    ];
    router.get(
      '/',
      describeRoute({
        tags: ['Studio'],
        summary: 'Get the default skills for new projects',
        operationId: 'projectDefaultSkillsGet',
        security,
        ...cliRoute({
          command: 'project default-skills get',
        }),
        description:
          'An empty list by default. Existing projects keep their own attachments. Requires agents.agents read or manage.',
        responses: {
          200: dataResponse(ProjectDefaultSkillsSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: {
            skillIds: await readProjectDefaultSkills(projects.tx.read()),
          },
        }),
    );
    router.put(
      '/',
      describeRoute({
        tags: ['Studio'],
        summary: 'Set the default skills for new projects',
        operationId: 'projectDefaultSkillsSet',
        security,
        ...cliRoute({
          command: 'project default-skills set',
          flags: { skillIds: { name: 'skills' } },
        }),
        description:
          'Validates skill ids and replaces the defaults. An empty array clears them. Only projects created afterwards copy this list, within their creation transaction. Requires agents.agents manage.',
        responses: {
          200: dataResponse(ProjectDefaultSkillsSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', ProjectDefaultSkillsSchema),
      async (context) => {
        const skillIds = await projects.tx.run(async ({ conn }) => {
          const unique = await skills.validateIds(
            conn,
            context.req.valid('json').skillIds,
          );
          await writeProjectDefaultSkills(conn, unique);
          return unique;
        });
        return context.json({ data: { skillIds } });
      },
    );
    return new Hono().route('/projectDefaultSkills', router);
  });

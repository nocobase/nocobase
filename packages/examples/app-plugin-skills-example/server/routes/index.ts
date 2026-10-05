import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorResponse,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { appNoticeServiceToken } from '../tokens.js';
import { AppNotice } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);
    const notice = container.resolve(appNoticeServiceToken);

    router.use('/skillsExample/notice', authentication.required());
    router.get(
      '/skillsExample/notice',
      describeRoute({
        tags: ['SkillsExample'],
        summary: 'Get the default notice',
        operationId: 'skillsExampleGetNotice',
        description:
          'The fixed notice the `AppNotice` component shows. Requires a session or an API key and no further permission, because the notice is not sensitive.',
        responses: {
          200: dataResponse(AppNotice),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      (context) => context.json({ data: notice.getDefaultNotice() }),
    );

    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;

import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';

import {
  notificationApiError,
  notificationErrorHandler,
} from '../http-errors.js';
import type { NotificationProviderApplicationConfig } from '../providers/notification.js';
import { notificationRuntimeToken } from '../runtime.js';

type NotificationRoutesEnv = {
  Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
};

export const apiRoutes: AppApiRouteContribution<
  AppPluginApplication<NotificationProviderApplicationConfig>
> = defineApiRoutes(({ container }) => {
  const router = new Hono();
  const notification = container.resolve(notificationRuntimeToken);
  const auth = container.resolve(authenticationToken);
  const authorization = container.resolve(authorizationToken);

  const logs = new Hono<NotificationRoutesEnv>();
  logs.onError(notificationErrorHandler);
  logs.use('/logs/:logId?', auth.required(), authorization.middleware());
  logs.use('/logs/:logId?', async (context, next) => {
    const allowed = await context.get('authz').can({
      resource: { type: 'page', id: 'notification.logs' },
      action: 'access',
    });
    if (!allowed) {
      throw notificationApiError(context as Context, {
        status: 'PERMISSION_DENIED',
        reason: 'NOTIFICATION_LOGS_FORBIDDEN',
        key: 'errors.logsForbidden',
      });
    }
    await next();
  });
  logs.route('/', notification.router);

  router.route('/notifications', logs);
  return router;
});

const routes: readonly AppApiRouteContribution<
  AppPluginApplication<NotificationProviderApplicationConfig>
>[] = [apiRoutes];

export default routes;

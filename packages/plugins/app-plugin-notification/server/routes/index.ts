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
import { Hono, type MiddlewareHandler } from 'hono';

import { NOTIFICATION_SETTINGS_RESOURCE } from '../../shared/access.js';
import { notificationErrorHandler } from '../http-errors.js';
import type { NotificationProviderApplicationConfig } from '../providers/notification.js';
import { notificationRuntimeToken } from '../runtime.js';
import { createPreferenceRoutes } from './preferences.js';
import { createSettingsRoutes } from './settings.js';

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
  const signedIn: readonly MiddlewareHandler[] = [
    auth.required() as MiddlewareHandler,
    authorization.middleware() as MiddlewareHandler,
  ];

  const logs = new Hono<NotificationRoutesEnv>();
  logs.onError(notificationErrorHandler);
  logs.use(
    '/logs/:logId?',
    ...(signedIn as MiddlewareHandler<NotificationRoutesEnv>[]),
  );
  logs.use('/logs/:logId?', async (context, next) => {
    await context
      .get('authz')
      .require({ resource: NOTIFICATION_SETTINGS_RESOURCE, action: 'read' });
    await next();
  });
  logs.route('/', notification.router);

  router.route('/notifications', logs);
  router.route('/notifications', createSettingsRoutes(container, signedIn));
  router.route(
    '/notifications',
    createPreferenceRoutes(container, auth.required()),
  );
  return router;
});

const routes: readonly AppApiRouteContribution<
  AppPluginApplication<NotificationProviderApplicationConfig>
>[] = [apiRoutes];

export default routes;

import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';

import {
  PdfConverterUnavailableError,
  PrintOutputLimitError,
} from './errors.js';
import { createTemplatePrintRoutes } from './template-print.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(async (app) => {
    const router = new Hono<AuthorizationEnv>();
    const authentication = app.container.resolve(authenticationToken);
    const authorization = app.container.resolve(authorizationToken);
    const database = app.container.resolve(databaseManagerToken);

    router.use('*', authentication.required(), authorization.middleware());
    router.route('/', createTemplatePrintRoutes(database));
    router.onError((error, context) => {
      if (error instanceof AuthorizationDeniedError)
        return context.json({ code: 'FORBIDDEN' }, 403);
      if (error instanceof TypeError)
        return context.json({ code: 'INVALID_INPUT' }, 400);
      if (error instanceof PrintOutputLimitError)
        return context.json({ code: 'OUTPUT_LIMIT_EXCEEDED' }, 413);
      if (error instanceof PdfConverterUnavailableError)
        return context.json(
          {
            code: 'PDF_CONVERTER_UNAVAILABLE',
            message:
              'PDF conversion requires LibreOffice on the NocoBase server. Install LibreOffice in the application host or container and restart the application; DOCX downloads remain available.',
          },
          503,
        );

      console.error('Template print example request failed', error);
      return context.json({ code: 'TEMPLATE_RENDER_FAILED' }, 500);
    });

    return new Hono().route('/template-print-example', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;

import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import {
  ApiError,
  apiErrorResponses,
  apiErrorResponse,
  apiErrorHandler,
  apiValidator,
  dataResponse,
  listResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { notificationTemplateRegistryToken } from '../templates.js';
import {
  templateParams,
  templateQuery,
  previewInput,
  templateSchema,
  previewSchema,
} from './template-schemas.js';

export function createTemplateRoutes(container: ServiceContainer): Hono {
  const router = new Hono<{
    Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
  }>();
  router.onError(apiErrorHandler);
  const auth = container.resolve(authenticationToken);
  const authorization = container.resolve(authorizationToken);
  // This contribution owns authentication and authorization, including the preview's deeper path.
  const guard: MiddlewareHandler<{
    Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
  }> = async (context, next) => {
    if (
      !(await context.get('authz').can({
        resource: { type: 'page', id: 'notification.templates' },
        action: 'access',
      }))
    )
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        domain: 'notifications',
        reason: 'NOTIFICATION_TEMPLATES_FORBIDDEN',
        message: 'Notification template management access is required.',
      });
    context.header('Cache-Control', 'no-store');
    await next();
  };
  router.use('/templates', auth.required(), authorization.middleware(), guard);
  router.use(
    '/templates/*',
    auth.required(),
    authorization.middleware(),
    guard,
  );
  const templates = () => container.resolve(notificationTemplateRegistryToken);
  const missing = (): never => {
    throw new ApiError({
      status: 'NOT_FOUND',
      domain: 'notifications',
      reason: 'NOTIFICATION_TEMPLATE_NOT_FOUND',
      message: 'Notification template not found.',
    });
  };
  const tags = ['Notification'];
  const description =
    'Requires page:notification.templates/access. Only registered source-owned scenarios are covered; arbitrary dynamic sends and private composer templates cannot be enumerated. No business records, recipients or transport secrets are read.';
  router.get(
    '/templates',
    describeRoute({
      tags,
      operationId: 'notificationsListTemplates',
      summary: 'List registered notification templates',
      description: `${description} This bounded configuration directory is not paginated.`,
      responses: { 200: listResponse(templateSchema), ...apiErrorResponses },
    }),
    apiValidator('query', templateQuery),
    (context) => {
      const query = context.req.valid('query');
      const data = templates()
        .list()
        .filter(
          (item) =>
            (!query.category || item.category === query.category) &&
            (!query.channel ||
              item.channels.some(
                (channel) =>
                  channel.name === query.channel ||
                  channel.type === query.channel,
              )) &&
            (!query.search ||
              [
                item.id,
                item.name,
                item.category,
                item.trigger,
                item.recipients,
                item.contributor,
              ]
                .join(' ')
                .toLowerCase()
                .includes(query.search.toLowerCase())),
        );
      return context.json({ data, meta: { total: data.length } });
    },
  );
  router.get(
    '/templates/:templateId',
    describeRoute({
      tags,
      operationId: 'notificationsGetTemplate',
      summary: 'Get a registered notification template',
      description,
      responses: {
        200: dataResponse(templateSchema),
        404: apiErrorResponse(404),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', templateParams),
    (context) => {
      return context.json({
        data:
          templates().get(context.req.valid('param').templateId) ?? missing(),
      });
    },
  );
  router.post(
    '/templates/:templateId/preview',
    describeRoute({
      tags,
      operationId: 'notificationsPreviewTemplate',
      summary: 'Preview a notification with synthetic data',
      description: `${description} Renders registered synthetic data only. Unsupported locales use the first declared locale; languagePolicy describes multilingual or fixed-language send behavior. Never sends a message or changes configuration.`,
      responses: {
        200: dataResponse(previewSchema),
        404: apiErrorResponse(404),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', templateParams),
    apiValidator('json', previewInput),
    async (context) => {
      return context.json({
        data:
          (await templates().preview(
            context.req.valid('param').templateId,
            context.req.valid('json').locale,
          )) ?? missing(),
      });
    },
  );
  return new Hono().route('/', router);
}

import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  describeRoute,
  dataResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

export const uploadLimitRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes<AppPluginApplication>((app) => {
    const router = new Hono();
    router.get(
      '/file/uploadLimits',
      describeRoute({
        tags: ['File'],
        summary: 'Read disk upload limits',
        operationId: 'fileUploadLimits',
        security: [],
        description:
          'Public deployment metadata for upload preflight. Only disk names and numeric file-size limits are returned; storage paths and credentials are never returned.',
        responses: {
          200: dataResponse({
            type: 'object',
            required: ['default', 'disks'],
            properties: {
              default: { type: 'string' },
              disks: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  required: ['disk', 'maxBytes', 'maxFileSizeMb'],
                  properties: {
                    disk: { type: 'string' },
                    maxBytes: { type: 'integer' },
                    maxFileSizeMb: { type: 'integer' },
                  },
                },
              },
            },
          }),
        },
      }),
      (context) =>
        context.json({
          data: app.container.resolve(driveManagerToken).uploadLimits(),
        }),
    );
    return router;
  });

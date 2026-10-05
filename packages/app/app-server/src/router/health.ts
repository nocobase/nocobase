import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';

import { defineApiRoutes, type AppApiRouteContribution } from './routes.js';

export interface HealthCheckRoutesApplication {
  readonly appName: string;
  readonly publicBasePath: string;
}

export const healthCheckApiRoutes: AppApiRouteContribution<HealthCheckRoutesApplication> =
  defineApiRoutes((app: HealthCheckRoutesApplication): Hono => {
    const router = new Hono();

    router.get(
      '/healthz',
      describeRoute({
        tags: ['App'],
        summary: 'Check that the application is up',
        operationId: 'checkHealth',
        // Probes call it without a credential.
        security: [],
        description:
          'Answers while the application serves requests. Probes and load balancers read this body, which keeps its own shape rather than `{ data }`.',
        responses: {
          '200': {
            description: 'The application is up.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ok', 'app', 'basePath'],
                  properties: {
                    ok: { const: true },
                    app: {
                      type: 'object',
                      required: ['name', 'basePath'],
                      properties: {
                        name: { type: 'string' },
                        basePath: { type: 'string' },
                      },
                    },
                    basePath: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      }),
      (context) =>
        context.json({
          ok: true,
          app: {
            name: app.appName,
            basePath: app.publicBasePath,
          },
          basePath: app.publicBasePath,
        }),
    );
    return router;
  });

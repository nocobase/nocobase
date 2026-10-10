/**
 * `/api/reports`: the dashboard page (its figures and what needs attention) and the acceptance metrics (`shared/reports.ts`). Both need the reports grant
 * (page `reports`, which Studio declares in `shared/access.ts`), checked before the input; they count every run for a
 * reader of agents (`agents.agents` read), otherwise the caller's own, and only runs on issues the caller may see.
 * Errors are the standard body (`../http/errors.ts`).
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { ReportCaller } from '@nocobase/app-plugin-agents/server/tokens';
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
import { z } from 'zod';

import { STUDIO_PAGES } from '../../shared/access.js';
import {
  DASHBOARD_PERIODS,
  USAGE_GROUP_BYS,
  type DashboardPeriod,
} from '../../shared/reports.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import { metricsText, REPORTS_READ, usageText } from './text.js';
import {
  DashboardAttentionSchema,
  DashboardReportSchema,
  MetricsReportSchema,
  UsageReportSchema,
} from './schemas.js';
import { studioReportsToken } from './token.js';

const tags = ['Studio'];
const NEEDS =
  'Needs the reports grant (page `reports`); counts every run with `agents.agents` `read`, otherwise the caller’s own, and only issues the caller may see.';

type Env = AuthorizationEnv & { Variables: { reportCaller: ReportCaller } };

const DashboardQuery = z.object({
  days: z.coerce
    .number()
    .refine(
      (days): days is DashboardPeriod =>
        (DASHBOARD_PERIODS as readonly number[]).includes(days),
      `days is one of ${DASHBOARD_PERIODS.join(', ')}.`,
    )
    .default(30),
});

const DAY = /^\d{4}-\d{2}-\d{2}$/u;

const MetricsQuery = z.object({
  from: z.string().regex(DAY, 'A day, YYYY-MM-DD.').optional().meta({
    description:
      'The first day, YYYY-MM-DD (UTC); 30 days before `to` by default.',
  }),
  to: z
    .string()
    .regex(DAY, 'A day, YYYY-MM-DD.')
    .optional()
    .meta({ description: 'The last day, YYYY-MM-DD (UTC); today by default.' }),
  projectId: z.string().min(1).optional(),
});

const UsageQuery = MetricsQuery.extend({
  groupBy: z.enum(USAGE_GROUP_BYS).default('agent'),
  agentId: z.string().min(1).optional(),
  userId: z.string().min(1).optional().meta({
    description: 'Only the runs this person started (their user id).',
  }),
});

/** A person, or an agent's run when its agent may read reports for the person who woke it. */
const personOrRun: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { runToken: [] },
];

export const reportsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    // Without authentication, authorization or the reports (an application's own tests) there is nothing to serve.
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(studioReportsToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const reports = container.resolve(studioReportsToken);

    const routes = new Hono<Env>();
    routes.onError(studioErrorHandler);
    // A key scoped to reports (`studio.reports`) may read them: every request checks the page grant through `authz`.
    routes.use('*', authentication.required({ scopedKeys: true }));
    routes.use('*', authorization.middleware());
    // Who asks, once they hold the reports grant.
    routes.use('*', async (context: Context<Env>, next) => {
      const authz = context.get('authz');
      if (
        !(await authz.can({
          resource: { type: 'page', id: STUDIO_PAGES[0] },
          action: 'access',
        }))
      )
        throw studioError(
          'PERMISSION_DENIED',
          'REPORTS_FORBIDDEN',
          'This needs the reports grant.',
        );
      const userId = (context.get('auth' as never) as { user: { id: string } })
        .user.id;
      context.set('reportCaller', {
        userId,
        allRuns: await authz.can({
          resource: { type: 'settings', id: 'agents.agents' },
          action: 'read',
        }),
      });
      await next();
    });

    routes.get(
      '/dashboard',
      describeRoute({
        tags,
        summary: 'Get the dashboard report',
        operationId: 'reportsGetDashboard',
        ...cliRoute({
          command: 'report dashboard',
          examples: ['report dashboard --days 7'],
        }),
        description: `The last \`days\` days up to today (UTC), against the days before them: delivery, the agents' performance, day by day and by project. ${NEEDS}`,
        responses: {
          200: dataResponse(DashboardReportSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', DashboardQuery),
      async (context) =>
        context.json({
          data: await reports.dashboard(
            context.get('reportCaller'),
            context.req.valid('query').days,
          ),
        }),
    );
    routes.get(
      '/attention',
      describeRoute({
        tags,
        summary: 'Get what needs attention',
        operationId: 'reportsGetAttention',
        ...cliRoute({ command: 'report attention' }),
        description: `The exceptions now: issues in Blocked, issues past their due date, pull requests open longer than two days, and runs on issues that failed in the last 24 hours and were not retried; each list holds its total and the first five. ${NEEDS}`,
        responses: {
          200: dataResponse(DashboardAttentionSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: await reports.attention(context.get('reportCaller')),
        }),
    );
    routes.get(
      '/metrics',
      describeRoute({
        tags,
        summary: 'Get the acceptance metrics',
        operationId: 'reportsGetMetrics',
        description: `${NEEDS} \`meta.message\` words the figures for a reader. An agent's run reads them for the person who woke it when its agent may read reports.`,
        security: personOrRun,
        responses: {
          200: dataResponse(MetricsReportSchema),
          ...apiErrorResponses,
        },
        ...cliRoute({
          command: 'report metrics',
          flags: {
            projectId: {
              name: 'project',
              description: "Only this project's issues and runs (its id).",
            },
          },
          action: REPORTS_READ,
        }),
      }),
      apiValidator('query', MetricsQuery),
      async (context) => {
        const { from, to, projectId } = context.req.valid('query');
        const report = await reports.metrics(context.get('reportCaller'), {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(projectId ? { projectId } : {}),
        });
        return context.json({
          data: report,
          meta: { message: metricsText(report) },
        });
      },
    );

    routes.get(
      '/usage',
      describeRoute({
        tags,
        summary: 'Get what agents’ runs used and cost',
        operationId: 'reportsGetUsage',
        description: `Grouped by agent, person, project, issue, day, model, tool or type. ${NEEDS} \`meta.message\` words the figures for a reader. An agent's run reads them for the person who woke it when its agent may read reports.`,
        security: personOrRun,
        responses: {
          200: dataResponse(UsageReportSchema),
          ...apiErrorResponses,
        },
        ...cliRoute({
          command: 'report usage',
          flags: {
            projectId: {
              name: 'project',
              description: "Only this project's issues and runs (its id).",
            },
            agentId: {
              name: 'agent',
              description: "Only this agent's runs (its id).",
            },
            userId: { name: 'user' },
          },
          action: REPORTS_READ,
          examples: ['report usage --group-by model --from 2026-09-01'],
        }),
      }),
      apiValidator('query', UsageQuery),
      async (context) => {
        const { from, to, projectId, groupBy, agentId, userId } =
          context.req.valid('query');
        const report = await reports.usage(context.get('reportCaller'), {
          groupBy,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(projectId ? { projectId } : {}),
          ...(agentId ? { agentId } : {}),
          ...(userId ? { userId } : {}),
        });
        return context.json({
          data: report,
          meta: { message: usageText(report) },
        });
      },
    );

    const router = new Hono();
    router.route('/reports', routes);
    return router;
  });

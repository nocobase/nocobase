import { authenticationToken, type AuthEnv } from '@nocobase/app-plugin-authentication';
import { authorizationToken, type AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import { runIdentityOf, RUN_SELF_ACTION, type CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import { DomainError, projectsAccessToken, type Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ApiError, apiErrorHandler, apiErrorResponses, apiValidator, cliRoute, dataResponse, defineApiRoutes, describeRoute, type AppApiRouteContribution } from '@nocobase/app-server/router';
import { Hono, type Context, type ErrorHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { DaySchema, NarrativeSchema, PublishedSchema, REPORT_PAGE, SettingsInputSchema, SettingsSchema } from '../shared/reports.js';
import { CurrentContextSchema, FactsSchema, GenerateSchema, PageDataSchema } from '../shared/page.js';
import { projectReportsToken } from './tokens.js';
import { reportError } from './errors.js';

const tags = ['Project reports'];
const Ok = z.strictObject({ accepted: z.literal(true) });
const PageQuery = z.object({ date: DaySchema, days: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30)])).default(7), projectId: z.string().min(1).max(100).optional() });
const ProjectParam = z.object({ projectId: z.string().min(1).max(100) });
const ReportParam = z.object({ reportId: z.string().regex(/^[a-f0-9]{64}$/u) });
const Generated = z.object({ id: z.string(), attemptId: z.string(), reused: z.boolean() });
type Env = AuthEnv & AuthorizationEnv & { Variables: { reportViewer: Viewer } };
const errors: ErrorHandler = (error, context) => {
  if (error instanceof z.ZodError) return apiErrorHandler(reportError('INVALID_ARGUMENT', 'REPORT_INPUT_INVALID', 'The report input is invalid.'), context);
  if (error instanceof DomainError) return apiErrorHandler(new ApiError({ status: error.kind === 'notFound' ? 'NOT_FOUND' : error.kind === 'forbidden' ? 'PERMISSION_DENIED' : error.kind === 'unauthorized' ? 'UNAUTHENTICATED' : 'INVALID_ARGUMENT', domain: 'project-reports', reason: 'REPORT_PROJECT_UNAVAILABLE', message: 'The project is not available for this operation.' }), context);
  return apiErrorHandler(error, context);
};

export const projectReportsRoutes: AppApiRouteContribution<AppPluginApplication> = defineApiRoutes(({ container }) => {
  const service = container.resolve(projectReportsToken);
  const authentication = container.resolve(authenticationToken);
  const authorization = container.resolve(authorizationToken);
  const access = container.resolve(projectsAccessToken);
  const router = new Hono();
  router.onError(errors);
  const human = new Hono<Env>();
  human.use('*', bodyLimit({ maxSize: 64 * 1024 }));
  human.use('*', authentication.required());
  human.use('*', authorization.middleware());
  human.use('*', async (context, next) => {
    const authz = context.var.authz;
    if (runIdentityOf(context.var.auth)) throw reportError('PERMISSION_DENIED', 'REPORT_HUMAN_REQUIRED', 'Report runs cannot manage reports or projects.');
    if (!await authz.can({ resource: { type: 'page', id: REPORT_PAGE }, action: 'access' })) throw reportError('PERMISSION_DENIED', 'REPORTS_FORBIDDEN', 'The reports page grant is required.');
    const userId = context.var.auth?.user.id;
    if (!userId) throw reportError('PERMISSION_DENIED', 'REPORT_USER_REQUIRED', 'Sign in to read project reports.');
    // This first UI release does not accept scoped API keys on the management routes.
    if (authz.identity.keyScope) throw reportError('PERMISSION_DENIED', 'REPORT_SCOPED_KEY_UNSUPPORTED', 'Use a signed-in session for report management.');
    context.set('reportViewer', { userId, actor: { type: 'user', id: userId }, permissions: await access.permissionsOf(authz.identity) });
    await next();
  });
  const humanSecurity = [{ cookieAuth: [] }];
  human.get('/', describeRoute({ tags, operationId: 'projectReportsList', summary: 'Read project reports and comparable historical metrics', security: humanSecurity, responses: { 200: dataResponse(PageDataSchema), ...apiErrorResponses } }), apiValidator('query', PageQuery), async (context) => {
    const query = context.req.valid('query');
    return context.json({ data: await service.page(context.var.reportViewer, query.date, query.days, query.projectId) });
  });
  human.put('/projects/:projectId/settings', describeRoute({ tags, operationId: 'projectReportsConfigure', summary: 'Configure a project report schedule and runner agent', security: humanSecurity, responses: { 200: dataResponse(SettingsSchema), ...apiErrorResponses } }), apiValidator('param', ProjectParam), apiValidator('json', SettingsInputSchema), async (context) => context.json({ data: await service.configure(context.var.reportViewer, context.req.valid('param').projectId, context.req.valid('json')) }));
  human.post('/projects/:projectId/generate', describeRoute({ tags, operationId: 'projectReportsGenerate', summary: 'Generate or retry a completed calendar day', security: humanSecurity, responses: { 200: dataResponse(Generated), ...apiErrorResponses } }), apiValidator('param', ProjectParam), apiValidator('json', GenerateSchema), async (context) => {
    const input = context.req.valid('json');
    return context.json({ data: await service.generate(context.var.reportViewer, context.req.valid('param').projectId, input.date, input.retry) });
  });
  human.post('/:reportId/cancel', describeRoute({ tags, operationId: 'projectReportsCancel', summary: 'Cancel the current generation without deleting the published report', security: humanSecurity, responses: { 200: dataResponse(Ok), ...apiErrorResponses } }), apiValidator('param', ReportParam), async (context) => {
    await service.cancel(context.var.reportViewer, context.req.valid('param').reportId);
    return context.json({ data: { accepted: true } });
  });
  human.get('/:reportId/evidence', describeRoute({ tags, operationId: 'projectReportsEvidence', summary: 'Read the published report and its pinned evidence', security: humanSecurity, responses: { 200: dataResponse(PublishedSchema.nullable()), ...apiErrorResponses } }), apiValidator('param', ReportParam), async (context) => {
    const detail = await service.detail(context.var.reportViewer, context.req.valid('param').reportId);
    return context.json({ data: detail.published?.published ?? null });
  });

  // These are narrow, authenticated run capabilities, not general administrative write endpoints.
  const run = new Hono<AuthEnv>();
  run.use('*', bodyLimit({ maxSize: 8 * 1024 * 1024 }));
  run.use('*', authentication.required({ scopedKeys: true }));
  const identityOf = (context: Context<AuthEnv>): CallerIdentity => {
    const identity = runIdentityOf(context.var.auth);
    if (!identity) throw reportError('PERMISSION_DENIED', 'REPORT_RUN_REQUIRED', 'A live project report run token is required.');
    return identity;
  };
  const runSecurity = [{ runToken: [] }];
  run.get('/context', describeRoute({ tags, operationId: 'projectReportsCurrentContext', summary: 'Read this report run’s immutable input', security: runSecurity, ...cliRoute({ command: 'project-report context', action: RUN_SELF_ACTION }), responses: { 200: dataResponse(CurrentContextSchema), ...apiErrorResponses } }), async (context) => {
    const own = await service.ownAttempt(identityOf(context));
    return context.json({ data: { context: own.context, facts: own.facts } });
  });
  run.post('/facts', describeRoute({ tags, operationId: 'projectReportsCurrentFacts', summary: 'Save immutable deterministic collector facts for this run', security: runSecurity, ...cliRoute({ command: 'project-report facts', action: RUN_SELF_ACTION }), responses: { 200: dataResponse(Ok), ...apiErrorResponses } }), apiValidator('json', FactsSchema), async (context) => {
    await service.saveFacts(identityOf(context), context.req.valid('json'));
    return context.json({ data: { accepted: true } });
  });
  run.post('/submit', describeRoute({ tags, operationId: 'projectReportsCurrentSubmit', summary: 'Publish this report run’s evidence-backed narrative', security: runSecurity, ...cliRoute({ command: 'project-report submit', action: RUN_SELF_ACTION }), responses: { 200: dataResponse(Ok), ...apiErrorResponses } }), apiValidator('json', NarrativeSchema), async (context) => {
    await service.submit(identityOf(context), context.req.valid('json'));
    return context.json({ data: { accepted: true } });
  });
  router.route('/project-reports/current', run);
  router.route('/project-reports', human);
  return router;
});

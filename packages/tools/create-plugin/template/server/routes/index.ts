import {
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

// Add defineApiRoutes() or defineRootRoutes() contributions here. Every Route must own and test an explicit security
// policy. Authenticated Routes install their own authentication and authorization; public callbacks document and test
// their protocol-specific boundary. Never depend on contribution order. API routes follow the HTTP API design that
// AGENTS.md links to: paths under this plugin's camelCase namespace, `{ data }` on success, `ApiError` on failure, input
// validated with `apiValidator()`, and a `describeRoute()` declaration on every route for the application's API
// document, both from `@nocobase/app-server/router`.
const routes: readonly AppRouteContribution<AppPluginApplication>[] = [];

export default routes;

import {
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

// Add defineApiRoutes() or defineRootRoutes() contributions here. Every Route
// must own and test an explicit security policy. Authenticated Routes install
// their own authentication and authorization; public callbacks document and
// test their protocol-specific boundary. Never depend on contribution order.
// API routes follow the HTTP API design that AGENTS.md links to: paths under
// this plugin's camelCase namespace, `{ data }` on success, `ApiError` on
// failure, and input validated with `parseApiInput()`.
const routes: readonly AppRouteContribution<AppPluginApplication>[] = [];

export default routes;

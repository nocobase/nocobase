import { Hono } from 'hono';

import { ApiDocsService, apiDocsToken } from './openapi/service.js';
import {
  ServiceProvider,
  type ServiceContainer,
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export * from './api-error.js';
export * from './api-limits.js';
export * from './health.js';
export * from './routes.js';
export * from './repository-routes.js';
export * from './openapi/index.js';
export {
  addRepositoryRequestConstraint,
  type RepositoryRequestConstraint,
} from './repository-constraints.js';

/**
 * The HTTP router owned by an application.
 *
 * The router is deliberately exposed as a service rather than being treated
 * as the application itself. This keeps the application lifecycle and
 * framework-specific HTTP implementation separate.
 */
export const routerToken: ServiceToken<Hono> = createServiceToken<Hono>(
  '@nocobase/app/router',
);

export interface RouterProviderApplication {
  readonly container: ServiceContainer;
}

export class RouterProvider<
  TApplication extends RouterProviderApplication = RouterProviderApplication,
> extends ServiceProvider<TApplication> {
  public readonly name: string = 'router';

  public override register(): void {
    this.app.container.instance(routerToken, new Hono());
    this.app.container.instance(apiDocsToken, new ApiDocsService());
  }
}

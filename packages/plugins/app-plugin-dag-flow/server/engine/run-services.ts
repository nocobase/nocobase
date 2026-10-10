import type { ServiceResolver, ServiceToken } from '@nocobase/service-provider';

/** Read-only application services available to Workflow run modules. */
export interface WorkflowRunServices {
  readonly has: <T>(token: ServiceToken<T>) => boolean;
  readonly resolve: <T>(token: ServiceToken<T>) => T;
}

/** Hide the mutable application container behind the run-module contract. */
export function createWorkflowRunServices(
  resolver: ServiceResolver,
): WorkflowRunServices {
  const services: WorkflowRunServices = {
    has<T>(token: ServiceToken<T>): boolean {
      return resolver.has(token);
    },
    resolve<T>(token: ServiceToken<T>): T {
      return resolver.resolve(token);
    },
  };
  return Object.freeze(services);
}

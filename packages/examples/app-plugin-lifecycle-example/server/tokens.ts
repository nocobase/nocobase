import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { DurableFlowService } from './services/durable-flows.js';
import type { LifecycleExampleService } from './services/lifecycle-example.js';

export type ExampleLifecycleName = 'tickets' | 'expenses';
export type Plain = Record<string, unknown>;

export const lifecycleExampleServiceToken: ServiceToken<LifecycleExampleService> =
  createServiceToken<LifecycleExampleService>(
    '@nocobase/app-plugin-lifecycle-example/service',
  );

export const durableFlowServiceToken: ServiceToken<DurableFlowService> =
  createServiceToken<DurableFlowService>(
    '@nocobase/app-plugin-lifecycle-example/durable-flows',
  );

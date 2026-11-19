import type { ParameterConfigurationService } from './services/parameter-configuration.js';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { DurableFlowService } from './services/durable-flows.js';
import type { LifecycleExampleService } from './services/lifecycle-example.js';

export type ExampleLifecycleName = 'tickets' | 'expenses' | 'expenses-v2';

/**
 * The expense definition new reports are drafted with. Reports drafted
 * before keep the definition they were created with.
 */
export const NEW_EXPENSE_DEFINITION = 'expenses-v2';
export type Plain = Record<string, unknown>;

export const lifecycleExampleServiceToken: ServiceToken<LifecycleExampleService> =
  createServiceToken<LifecycleExampleService>(
    '@nocobase/app-plugin-lifecycle-example/service',
  );

export const durableFlowServiceToken: ServiceToken<DurableFlowService> =
  createServiceToken<DurableFlowService>(
    '@nocobase/app-plugin-lifecycle-example/durable-flows',
  );

export const parameterConfigurationServiceToken: ServiceToken<ParameterConfigurationService> =
  createServiceToken<ParameterConfigurationService>(
    '@nocobase/app-plugin-lifecycle-example/parameters',
  );

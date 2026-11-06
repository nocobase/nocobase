import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { DemoConfigurationRuntime } from './contract.js';

export const demoConfigurationRuntimeToken: ServiceToken<DemoConfigurationRuntime> =
  createServiceToken<DemoConfigurationRuntime>(
    '@nocobase/app-plugin-demo-mode/configuration-runtime',
  );

import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

import WorkflowManagementProvider from './workflow-management.js';

import ScheduledLogJobProvider from './scheduled-log-job.js';

import AppExampleProvider from './app-example.js';
import AIFormFillProvider from './ai-form-fill.js';
import ExternalCrmProvider from './external-crm.js';

export {
  appExampleServiceToken,
  type AppExampleService,
} from './app-example.js';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  AppExampleProvider,
  AIFormFillProvider,
  WorkflowManagementProvider,
  ScheduledLogJobProvider,
  ExternalCrmProvider,
];

export default serviceProviders;

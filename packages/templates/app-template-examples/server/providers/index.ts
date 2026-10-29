import ProcurementRegistration from './procurement-registration.js';
import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

import WorkflowManagementProvider from './workflow-management.js';

import ScheduledLogJobProvider from './scheduled-log-job.js';

import AppExampleProvider from './app-example.js';
import AIFormFillProvider from './ai-form-fill.js';
import ExternalCrmProvider from './external-crm.js';
import KnowledgeAccessProvider from './knowledge-access.js';
import KnowledgeChatProvider from './knowledge-chat.js';

export {
  appExampleServiceToken,
  type AppExampleService,
} from './app-example.js';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  ProcurementRegistration,
  AppExampleProvider,
  AIFormFillProvider,
  WorkflowManagementProvider,
  ScheduledLogJobProvider,
  ExternalCrmProvider,
  KnowledgeAccessProvider,
  KnowledgeChatProvider,
];

export default serviceProviders;

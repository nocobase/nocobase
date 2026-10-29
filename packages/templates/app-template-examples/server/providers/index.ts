import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

import WorkflowManagementProvider from './workflow-management.js';

import ScheduledLogJobProvider from './scheduled-log-job.js';

import AppExampleProvider from './app-example.js';
import AIFormFillProvider from './ai-form-fill.js';
import ExternalCrmProvider from './external-crm.js';
import KnowledgeAccessProvider from './knowledge-access.js';
import KnowledgeChatProvider from './knowledge-chat.js';
import CustomerContactsAuthorizationProvider from './customer-contacts-authorization.js';

export {
  appExampleServiceToken,
  type AppExampleService,
} from './app-example.js';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  AppExampleProvider,
  AIFormFillProvider,
  WorkflowManagementProvider,
  ScheduledLogJobProvider,
  ExternalCrmProvider,
  KnowledgeAccessProvider,
  KnowledgeChatProvider,
  CustomerContactsAuthorizationProvider,
];

export default serviceProviders;

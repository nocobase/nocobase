import ConversationSharingProvider from './conversation-sharing.js';
import NotificationManagementProvider from './notification-management.js';
import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  ConversationSharingProvider,
  NotificationManagementProvider,
];

export default serviceProviders;

import ConversationSharingProvider from './conversation-sharing.js';
import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  ConversationSharingProvider,
];

export default serviceProviders;

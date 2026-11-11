import { PlatformMultiAppProvider } from '@nocobase/app-plugin-identity-provider/server/multi-app';
import TemplatePolicy from './template-policy.js';
import ReleasesAccessProvider from './releases-access.js';
import NotificationManagementProvider from './notification-management.js';
import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  NotificationManagementProvider,
  TemplatePolicy,
  PlatformMultiAppProvider,
  ReleasesAccessProvider,
];

export default serviceProviders;

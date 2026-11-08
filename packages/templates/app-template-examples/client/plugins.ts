import { featureOverviewLoaders } from './pages/capabilities/feature-overview-loaders.js';
import mail from '@nocobase/app-plugin-mail/client';
import mailExample from '@nocobase/app-plugin-mail-example/client';
import defaultAccess from '@nocobase/app-plugin-authz-default-access/client';
import sharingRules from '@nocobase/app-plugin-authz-sharing-rules/client';
import restrictionRules from '@nocobase/app-plugin-authz-restriction-rules/client';
import {
  defineClientPlugins,
  type AppClientPlugins,
} from '@nocobase/app-client/plugins';
import authentication from '@nocobase/app-plugin-authentication/client';
import authorization from '@nocobase/app-plugin-authorization/client';
import authorizationExample from '@nocobase/app-plugin-authorization-example/client';
import templatePrintExample from '@nocobase/app-plugin-template-print-example/client';
import users from '@nocobase/app-plugin-users/client';
import databaseExplorer from '@nocobase/app-plugin-database-explorer/client';
import notificationInApp from '@nocobase/app-plugin-notification-in-app/client';
import notificationExample from '@nocobase/app-plugin-notification-example/client';
import jobsExample from '@nocobase/app-plugin-jobs-example/client';
import realtimeExample from '@nocobase/app-plugin-realtime-example/client';
import lifecycleExample from '@nocobase/app-plugin-lifecycle-example/client';
import officeFlowsExample from '@nocobase/app-plugin-office-flows-example/client';
import routesExample from '@nocobase/app-plugin-routes-example/client';
import i18n from '@nocobase/app-plugin-i18n/client';
import notification from '@nocobase/app-plugin-notification/client';
import repositoryExample from '@nocobase/app-plugin-repository-example/client';
import scheduler from '@nocobase/app-plugin-scheduler/client';
import file from '@nocobase/app-plugin-file/client';
import fileExample from '@nocobase/app-plugin-file-example/client';
import apiKeys from '@nocobase/app-plugin-api-keys/client';
import agents from '@nocobase/app-plugin-agents/client';
import foundation from '@nocobase/app-plugin-foundation/client';
import applicationManifest from '../package.json' with { type: 'json' };
import knowledge from '@nocobase/app-plugin-knowledge/client';

const loadAuthorizationOverview = () =>
  import('./pages/capabilities/authorization-overview.js');

// Array order is contribution order. A plugin is enabled by appearing in this
// list; removing its entry and its import disables it.
const clientPlugins: AppClientPlugins = defineClientPlugins([
  authentication(),
  authorization(),
  defaultAccess(),
  sharingRules(),
  restrictionRules(),
  authorizationExample(),
  templatePrintExample(),
  users(),
  databaseExplorer(),
  apiKeys(),
  i18n(),
  notificationInApp(),
  notificationExample(),
  jobsExample(),
  realtimeExample(),
  lifecycleExample(),
  officeFlowsExample(),
  routesExample(),
  notification(),
  repositoryExample(),
  file(),
  fileExample(),
  scheduler(),
  mail(),
  mailExample(),
  agents(),
  // The manifest is what the capability guide lists: every plugin this application declares.
  foundation({
    manifest: applicationManifest,
    guideSettingsPath: '/settings',
    guideEntryLoaders: {
      ...featureOverviewLoaders,
      i18n: () => import('./pages/capabilities/i18n-overview.js'),
      'app-plugin-authorization': loadAuthorizationOverview,
      'app-plugin-authz-default-access': loadAuthorizationOverview,
      'app-plugin-authz-sharing-rules': loadAuthorizationOverview,
      'app-plugin-authz-restriction-rules': loadAuthorizationOverview,
      'app-plugin-i18n': () => import('./pages/capabilities/i18n-overview.js'),
      db: () => import('./pages/capabilities/database-overview.js'),
      'app-plugin-agents': () =>
        import('./pages/capabilities/agents-overview.js'),
    },
    navigation: false,
  }),
  knowledge({ routes: false }),
]);

export default clientPlugins;

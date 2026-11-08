import { featureOverviewLoaders } from './pages/capabilities/feature-overview-loaders.js';
import foundation from '@nocobase/app-plugin-foundation/client';
import applicationManifest from '../package.json' with { type: 'json' };
import defaultAccess from '@nocobase/app-plugin-authz-default-access/client';
import sharingRules from '@nocobase/app-plugin-authz-sharing-rules/client';
import restrictionRules from '@nocobase/app-plugin-authz-restriction-rules/client';
import {
  defineClientPlugins,
  type AppClientPlugins,
} from '@nocobase/app-client/plugins';
import apiKeys from '@nocobase/app-plugin-api-keys/client';
import authentication from '@nocobase/app-plugin-authentication/client';
import authorization from '@nocobase/app-plugin-authorization/client';
import databaseExplorer from '@nocobase/app-plugin-database-explorer/client';
import users from '@nocobase/app-plugin-users/client';
import notificationInApp from '@nocobase/app-plugin-notification-in-app/client';
import i18n from '@nocobase/app-plugin-i18n/client';
import notification from '@nocobase/app-plugin-notification/client';
import scheduler from '@nocobase/app-plugin-scheduler/client';
import file from '@nocobase/app-plugin-file/client';
import mail from '@nocobase/app-plugin-mail/client';

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
  databaseExplorer(),
  users(),
  apiKeys(),
  i18n(),
  notificationInApp(),
  notification(),
  file(),
  scheduler(),
  mail(),
  // The manifest is what the capability guide lists: every plugin this application declares.
  foundation({
    settingsGroup: true,
    manifest: applicationManifest,
    guideSettingsPath: '/settings',
    guideEntryLoaders: {
      ...featureOverviewLoaders,
      'app-plugin-file': () => import('./pages/capabilities/file-overview.js'),
      'app-plugin-database-explorer': () =>
        import('./pages/capabilities/database-explorer-overview.js'),
      'app-plugin-concurrency': () =>
        import('./pages/capabilities/concurrency-overview.js'),
      'app-plugin-authentication': () =>
        import('./pages/capabilities/authentication-overview.js'),
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
]);

export default clientPlugins;

import defaultAccess from '@nocobase/app-plugin-authz-default-access/server';
import sharingRules from '@nocobase/app-plugin-authz-sharing-rules/server';
import restrictionRules from '@nocobase/app-plugin-authz-restriction-rules/server';
import apiKeys from '@nocobase/app-plugin-api-keys/server';
import authentication from '@nocobase/app-plugin-authentication/server';
import authorization from '@nocobase/app-plugin-authorization/server';
import databaseExplorer from '@nocobase/app-plugin-database-explorer/server';
import users from '@nocobase/app-plugin-users/server';
import i18n from '@nocobase/app-plugin-i18n/server';
import notification from '@nocobase/app-plugin-notification/server';
import notificationInApp from '@nocobase/app-plugin-notification-in-app/server';
import notificationProviders from '@nocobase/app-plugin-notification-providers/server';
import workflow from '@nocobase/app-plugin-workflow/server';
import {
  defineServerPlugins,
  type AppServerPlugins,
} from '@nocobase/app-server/plugins';
import scheduler from '@nocobase/app-plugin-scheduler/server';
import file from '@nocobase/app-plugin-file/server';

const serverPlugins: AppServerPlugins = defineServerPlugins([
  authentication,
  authorization,
  defaultAccess,
  sharingRules,
  restrictionRules,
  databaseExplorer,
  users,
  apiKeys,
  i18n,
  notification,
  notificationInApp,
  notificationProviders,
  workflow,
  file,
  scheduler,
]);

export default serverPlugins;

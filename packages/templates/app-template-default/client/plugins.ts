import agents from '@nocobase/app-plugin-agents/client';
import foundation from '@nocobase/app-plugin-foundation/client';
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
import { pagePermissionTitles } from './pages/settings/page-permission-titles.js';
import { permissionPageCatalog } from './pages/settings/permission-catalog.js';
import { permissionWorkspaceSelection } from './pages/settings/permission-workspace.js';
import databaseExplorer from '@nocobase/app-plugin-database-explorer/client';
import distributed from '@nocobase/app-plugin-distributed/client';
import users from '@nocobase/app-plugin-users/client';
import notificationInApp from '@nocobase/app-plugin-notification-in-app/client';
import i18n from '@nocobase/app-plugin-i18n/client';
import notification from '@nocobase/app-plugin-notification/client';
import scheduler from '@nocobase/app-plugin-scheduler/client';
import file from '@nocobase/app-plugin-file/client';
import mail from '@nocobase/app-plugin-mail/client';

// Array order is contribution order. A plugin is enabled by appearing in this
// list; removing its entry and its import disables it.
const clientPlugins: AppClientPlugins = defineClientPlugins([
  authentication(),
  // The Roles and permissions pages list this application's pages and business objects.
  authorization({
    pageCatalog: permissionPageCatalog,
    workspace: permissionWorkspaceSelection,
    pageTitles: pagePermissionTitles,
  }),
  defaultAccess(),
  sharingRules(),
  restrictionRules(),
  databaseExplorer(),
  users(),
  apiKeys(),
  i18n(),
  notificationInApp({ inboxRoute: true }),
  notification(),
  file(),
  distributed(),
  scheduler(),
  mail({ workspaceRoutes: true, routes: { mail: false, mailTeam: false } }),
  // The Agent panel and ✦ in the header, the conversation page, System settings › AI and Personal settings › Agent.
  agents({ chatRoutes: true }),
  foundation(),
]);

export default clientPlugins;

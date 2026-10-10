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
import {
  defineServerPlugins,
  type AppServerPlugins,
} from '@nocobase/app-server/plugins';
import scheduler from '@nocobase/app-plugin-scheduler/server';
import file from '@nocobase/app-plugin-file/server';
import projects from '@nocobase/app-plugin-projects/server';
import agents from '@nocobase/app-plugin-agents/server';
import releases from '@nocobase/app-plugin-releases/server';
import knowledge from '@nocobase/app-plugin-knowledge/server';

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
  file,
  scheduler,
  projects,
  // Agents, and the runners people connect to run them (with the jobs of the off-by-default runner build method).
  agents,
  // Release management: Apps, environments and deployments, on Studio's roles (`server/releases`); environments run
  // their Apps in process or in Docker (`releases.docker` starts the Docker App Host).
  releases,
  // The knowledge base: spaces of versioned documents, proposals and snapshots; Studio names its spaces (the system's and
  // one per project) and decides who reads, proposes and edits them (`server/knowledge`).
  knowledge,
]);

export default serverPlugins;

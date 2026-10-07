import defaultAccess from '@nocobase/app-plugin-authz-default-access/server';
import sharingRules from '@nocobase/app-plugin-authz-sharing-rules/server';
import restrictionRules from '@nocobase/app-plugin-authz-restriction-rules/server';
import authentication from '@nocobase/app-plugin-authentication/server';
import aiEmployee from '@nocobase/app-plugin-ai-employee/server/plugin';
import aiEmployeeExample from '@nocobase/app-plugin-ai-employee-example/server';
import authorization from '@nocobase/app-plugin-authorization/server';
import users from '@nocobase/app-plugin-users/server';
import authorizationExample from '@nocobase/app-plugin-authorization-example/server';
import templatePrintExample from '@nocobase/app-plugin-template-print-example/server';
import departmentsExample from '@nocobase/app-plugin-departments-example/server';
import databaseExplorer from '@nocobase/app-plugin-database-explorer/server';
import databaseExample from '@nocobase/app-plugin-database-example/server';
import i18n from '@nocobase/app-plugin-i18n/server';
import jobsExample from '@nocobase/app-plugin-jobs-example/server';
import notification from '@nocobase/app-plugin-notification/server';
import notificationInApp from '@nocobase/app-plugin-notification-in-app/server';
import notificationProviders from '@nocobase/app-plugin-notification-providers/server';
import notificationExample from '@nocobase/app-plugin-notification-example/server';
import queueExample from '@nocobase/app-plugin-queue-example/server';
import realtimeExample from '@nocobase/app-plugin-realtime-example/server';
import routesExample from '@nocobase/app-plugin-routes-example/server';
import serviceProviderExample from '@nocobase/app-plugin-service-provider-example/server';
import workflow from '@nocobase/app-plugin-workflow/server';
import skillsExample from '@nocobase/app-plugin-skills-example/server';
import {
  defineServerPlugins,
  type AppServerPlugins,
} from '@nocobase/app-server/plugins';
import repositoryExample from '@nocobase/app-plugin-repository-example/server';
import scheduler from '@nocobase/app-plugin-scheduler/server';
import file from '@nocobase/app-plugin-file/server';
import fileExample from '@nocobase/app-plugin-file-example/server';
import apiKeys from '@nocobase/app-plugin-api-keys/server';

const serverPlugins: AppServerPlugins = defineServerPlugins([
  authentication,
  aiEmployee,
  aiEmployeeExample,
  authorization,
  defaultAccess,
  sharingRules,
  restrictionRules,
  authorizationExample,
  templatePrintExample,
  departmentsExample,
  users,
  databaseExplorer,
  apiKeys,
  databaseExample,
  i18n,
  notification,
  notificationInApp,
  notificationProviders,
  notificationExample,
  queueExample,
  realtimeExample,
  jobsExample,
  routesExample,
  serviceProviderExample,
  workflow,
  skillsExample,
  repositoryExample,
  file,
  fileExample,
  scheduler,
]);

export default serverPlugins;

import mail from '@nocobase/app-plugin-mail/client';
import mailExample from '@nocobase/app-plugin-mail-example/client';
import defaultAccess from '@nocobase/app-plugin-authz-default-access/client';
import sharingRules from '@nocobase/app-plugin-authz-sharing-rules/client';
import restrictionRules from '@nocobase/app-plugin-authz-restriction-rules/client';
import {
  defineClientPlugins,
  type AppClientPlugins,
} from '@nocobase/app-client/plugins';
import aiEmployee from '@nocobase/app-plugin-ai-employee/client';
import aiEmployeeExample from '@nocobase/app-plugin-ai-employee-example/client';
import authentication from '@nocobase/app-plugin-authentication/client';
import authorization from '@nocobase/app-plugin-authorization/client';
import authorizationExample from '@nocobase/app-plugin-authorization-example/client';
import templatePrintExample from '@nocobase/app-plugin-template-print-example/client';
import departmentsExample from '@nocobase/app-plugin-departments-example/client';
import users from '@nocobase/app-plugin-users/client';
import databaseExplorer from '@nocobase/app-plugin-database-explorer/client';
import notificationInApp from '@nocobase/app-plugin-notification-in-app/client';
import notificationExample from '@nocobase/app-plugin-notification-example/client';
import jobsExample from '@nocobase/app-plugin-jobs-example/client';
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

// Array order is contribution order. A plugin is enabled by appearing in this
// list; removing its entry and its import disables it.
const clientPlugins: AppClientPlugins = defineClientPlugins([
  authentication(),
  aiEmployee(),
  aiEmployeeExample(),
  authorization(),
  defaultAccess(),
  sharingRules(),
  restrictionRules(),
  authorizationExample(),
  templatePrintExample(),
  departmentsExample(),
  users({ mount: 'settings', path: '/users' }),
  databaseExplorer(),
  apiKeys({ path: '/api-keys' }),
  i18n(),
  notificationInApp(),
  notificationExample(),
  jobsExample(),
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
]);

export default clientPlugins;

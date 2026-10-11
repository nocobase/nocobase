import defaultAccess from '@nocobase/app-plugin-authz-default-access/client';
import sharingRules from '@nocobase/app-plugin-authz-sharing-rules/client';
import restrictionRules from '@nocobase/app-plugin-authz-restriction-rules/client';
import {
  defineClientPlugins,
  type AppClientPlugins,
} from '@nocobase/app-client/plugins';
import authentication from '@nocobase/app-plugin-authentication/client';
import authorization from '@nocobase/app-plugin-authorization/client';
import databaseExplorer from '@nocobase/app-plugin-database-explorer/client';
import users from '@nocobase/app-plugin-users/client';
import notificationInApp from '@nocobase/app-plugin-notification-in-app/client';
import i18n from '@nocobase/app-plugin-i18n/client';
import notification from '@nocobase/app-plugin-notification/client';
import scheduler from '@nocobase/app-plugin-scheduler/client';
import file from '@nocobase/app-plugin-file/client';
import projects from '@nocobase/app-plugin-projects/client';
import agents from '@nocobase/app-plugin-agents/client';
import releases from '@nocobase/app-plugin-releases/client';
import knowledge from '@nocobase/app-plugin-knowledge/client';

// Array order is contribution order. A plugin is enabled by appearing in this
// list; removing its entry and its import disables it.
const clientPlugins: AppClientPlugins = defineClientPlugins([
  authentication(),
  authorization(),
  defaultAccess(),
  sharingRules(),
  restrictionRules(),
  databaseExplorer(),
  // Of the users plugin's pages Studio serves only the invitation (`/invite/:token`): its users page is a back-office
  // settings page, and Studio does not mount those (`routing/app-router.tsx`); members are managed at `/config/members`.
  users(),
  // The API keys plugin's own page predates scopes: Studio routes its own (`/account/api-keys`, Settings › API keys), and
  // keeps `apiKeyClient` in `config/auth.ts`.
  i18n(),
  notificationInApp(),
  notification(),
  file(),
  scheduler(),
  // Studio routes the work pages itself, under its Work section (`client/routes.ts`).
  projects({ routes: false }),
  // Studio routes the agent team pages itself, under its Agent team section (`client/routes.ts`).
  agents(),
  // Studio routes release management's pages itself, under its Releases section (`client/routes.ts`).
  releases({ routes: false }),
  // Studio routes the knowledge page itself (`/knowledge`, the system's space) and composes the knowledge view into a
  // project's Knowledge tab (`client/routes.ts`).
  knowledge({ routes: false }),
]);

export default clientPlugins;

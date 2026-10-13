import type { AppConfigFactory } from '@nocobase/app-server/config';
import {
  defineUsersConfig,
  type UsersConfig,
} from '@nocobase/app-plugin-users/server/config';

// Studio offers its own roles in the user pages (`server/access/user-scope.ts`), so the plugin's permission-set picker
// is off. The initial administrator comes from config.yml or INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_EMAIL and
// INITIAL_ADMIN_PASSWORD, read once while the user table is empty.
const users: AppConfigFactory<UsersConfig> = defineUsersConfig({
  defaults: { permissionSets: false },
});

export default users;

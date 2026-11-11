import type { AppConfigFactory } from '@nocobase/app-server/config';
import {
  defineUsersConfig,
  type UsersConfig,
} from '@nocobase/app-plugin-users/server/config';

// The initial administrator comes from config.yml (users.initialAdmin) or INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_EMAIL
// and INITIAL_ADMIN_PASSWORD, read once while the user table is empty.
const users: AppConfigFactory<UsersConfig> = defineUsersConfig();

export default users;

import type { AppConfigFactory } from '@nocobase/app-server/config';
import {
  defineAccountSwitcherConfig,
  type AccountSwitcherConfig,
} from '@nocobase/app-plugin-account-switcher/server';

// On while developing and off otherwise. NOCOBASE_ACCOUNT_SWITCHER_MODE or accountSwitcher.mode in config.yml sets it.
const accountSwitcher: AppConfigFactory<AccountSwitcherConfig> =
  defineAccountSwitcherConfig();

export default accountSwitcher;

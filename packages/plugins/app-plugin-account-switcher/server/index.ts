export { default } from './plugin.js';
export {
  ACCOUNT_SWITCHER_MODE_ENV,
  defineAccountSwitcherConfig,
  type AccountSwitcherConfig,
} from './config.js';
export {
  accountSwitcherServiceToken,
  type AccountSwitcherService,
} from './tokens.js';
export type {
  AccountSwitchState,
  AccountSwitcherMode,
  SwitchableAccount,
} from '../shared/types.js';

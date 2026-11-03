import {
  defineAppConfig,
  envString,
  type AppConfigAccessor,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

import type { AccountSwitcherMode } from '../shared/types.js';

const MODES: readonly AccountSwitcherMode[] = ['off', 'full'];

/** Register this section separately from the Server plugin in defaultAppConfigs. */
export interface AccountSwitcherConfig {
  readonly mode?: AccountSwitcherMode;
}

export const ACCOUNT_SWITCHER_MODE_ENV = 'NOCOBASE_ACCOUNT_SWITCHER_MODE';

/** On by default only while developing: `NODE_ENV` chooses the default, and access still requires a Super Admin. */
export function defineAccountSwitcherConfig(): AppConfigFactory<AccountSwitcherConfig> {
  return defineAppConfig<AccountSwitcherConfig>({
    defaults: ({ env }) => ({
      mode: env.NODE_ENV === 'development' ? 'full' : 'off',
    }),
    public: ['mode'],
    env: {
      [ACCOUNT_SWITCHER_MODE_ENV]: envString('mode', {
        description: 'Whether account switching is available: off or full.',
      }),
    },
    validate(value, context) {
      if (!MODES.includes(value.mode as AccountSwitcherMode))
        context.error('mode', `must be one of ${MODES.join(', ')}.`);
    },
  });
}

/**
 * The configured mode, off when the application registers no configuration section. Refuses `full` outside development
 * and tests: acting as someone with full access leaves records attributed to them alone, which only suits disposable
 * data. Off in a demo too, whose write protection would refuse a switch and which has an account menu of its own.
 */
export function resolveAccountSwitcherMode(
  config: Pick<AppConfigAccessor, 'get'>,
  nodeEnv: string | undefined,
): AccountSwitcherMode {
  const mode =
    config.get<AccountSwitcherConfig>('accountSwitcher')?.mode ?? 'off';
  if (mode === 'full' && nodeEnv !== 'development' && nodeEnv !== 'test')
    throw new Error(
      `accountSwitcher.mode "full" is only available in development, not with NODE_ENV "${nodeEnv ?? ''}".`,
    );
  return config.get<{ enabled?: boolean }>('demoMode')?.enabled === true
    ? 'off'
    : mode;
}

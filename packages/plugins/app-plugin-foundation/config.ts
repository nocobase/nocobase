import {
  defineAppConfig,
  envBoolean,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

/** The `foundation` configuration section. */
export interface FoundationConfig {
  /**
   * Whether the application submits a scan when it starts without a snapshot of the running kernel version. Defaults
   * to `true`. When `false`, only an explicit request — opening the page, Refresh or Count records — starts one.
   */
  readonly scanOnStart?: boolean;
}

/** Pure configuration declaration: importing or calling it starts nothing and reads no environment. */
export function defineFoundationConfig(): AppConfigFactory<FoundationConfig> {
  return defineAppConfig<FoundationConfig>({
    defaults: { scanOnStart: true },
    public: [],
    env: {
      FOUNDATION_SCAN_ON_START: envBoolean('scanOnStart', {
        description:
          'Whether App Foundation scans the application when it starts without a current snapshot; true when unset.',
        required: false,
      }),
    },
    validate(value, context) {
      if (
        value.scanOnStart !== undefined &&
        typeof value.scanOnStart !== 'boolean'
      )
        context.error('scanOnStart', 'Expected true or false.');
    },
  });
}

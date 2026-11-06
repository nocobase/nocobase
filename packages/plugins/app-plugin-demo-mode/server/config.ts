import {
  defineAppConfig,
  envBoolean,
  envInteger,
  envString,
  envStrings,
  type AppConfigAccessor,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { DemoDailySchedule } from '../shared/configuration.js';

const DEFAULT_DAILY_RESET = {
  hour: 3,
  minute: 0,
  timezone: 'UTC',
  language: 'en-US',
};

export interface DemoModeSettings {
  readonly enabled: boolean;
  readonly allowCollections: ReadonlySet<string>;
  readonly quickSignIn: boolean;
  readonly dailyReset: Readonly<DemoDailySchedule>;
}

/** Register this section separately from the Server plugin in defaultAppConfigs. */
export interface DemoModeConfig {
  readonly enabled?: boolean;
  /** Logical collection names in the default database connection, matching migrations. */
  readonly allowCollections?: readonly string[];
  readonly quickSignIn?: boolean;
  /** Deployment-owned schedule; daily reset is always enabled in demo mode. */
  readonly dailyReset?: Partial<Omit<DemoDailySchedule, 'enabled'>>;
}

export const DEMO_MODE_ENV = 'NOCOBASE_DEMO_MODE';
export const DEMO_MODE_WRITABLE_COLLECTIONS_ENV =
  'NOCOBASE_DEMO_WRITABLE_COLLECTIONS';

/** Authentication writes needed even when the demo otherwise refuses changes. */
export const DEFAULT_ALLOW_COLLECTIONS: readonly string[] = [
  'session',
  'verification',
];

/** The runtime resolves environment values in the owning application's scope. */
export function defineDemoModeConfig(): AppConfigFactory<DemoModeConfig> {
  return defineAppConfig<DemoModeConfig>({
    defaults: {
      enabled: false,
      allowCollections: [],
      quickSignIn: true,
      dailyReset: DEFAULT_DAILY_RESET,
    },
    public: ['enabled'],
    env: {
      [DEMO_MODE_ENV]: envBoolean('enabled', {
        description: 'Whether this deployment is a demo environment.',
      }),
      [DEMO_MODE_WRITABLE_COLLECTIONS_ENV]: envStrings(
        'allowCollections',
        ',',
        {
          description:
            'Comma-separated logical collections writable in demo mode.',
          required: false,
        },
      ),
      NOCOBASE_DEMO_RESET_HOUR: envInteger('dailyReset.hour', {
        description: 'Daily demo reset hour (0–23). Defaults to 3.',
      }),
      NOCOBASE_DEMO_RESET_MINUTE: envInteger('dailyReset.minute', {
        description: 'Daily demo reset minute (0–59). Defaults to 0.',
      }),
      NOCOBASE_DEMO_RESET_TIMEZONE: envString('dailyReset.timezone', {
        description: 'IANA time zone for daily demo resets. Defaults to UTC.',
      }),
      NOCOBASE_DEMO_RESET_LANGUAGE: envString('dailyReset.language', {
        description:
          'Dataset language for daily demo resets. Defaults to en-US.',
      }),
    },
    validate(value, context) {
      if (typeof value.enabled !== 'boolean')
        context.error('enabled', 'must be a boolean.');
      if (
        !Array.isArray(value.allowCollections) ||
        value.allowCollections.some(
          (table: unknown) =>
            typeof table !== 'string' ||
            !/^[a-z][a-z0-9_]*$/iu.test(table.trim()),
        )
      )
        context.error(
          'allowCollections',
          'must be an array of logical collection names.',
        );
      if (typeof value.quickSignIn !== 'boolean')
        context.error('quickSignIn', 'must be a boolean.');
      const schedule = value.dailyReset;
      for (const [field, max] of [
        ['hour', 23],
        ['minute', 59],
      ] as const) {
        const part = schedule?.[field];
        if (
          typeof part !== 'number' ||
          !Number.isInteger(part) ||
          part < 0 ||
          part > max
        )
          context.error(
            `dailyReset.${field}`,
            `must be an integer from 0 to ${max}.`,
          );
      }
      try {
        if (
          typeof schedule?.timezone !== 'string' ||
          !schedule.timezone ||
          schedule.timezone.length > 128
        )
          throw new Error('Missing timezone.');
        new Intl.DateTimeFormat('en', { timeZone: schedule.timezone }).format();
      } catch {
        context.error('dailyReset.timezone', 'must be a valid IANA time zone.');
      }
      try {
        if (
          typeof schedule?.language !== 'string' ||
          !schedule.language ||
          schedule.language.length > 16
        )
          throw new Error('Missing language.');
        Intl.getCanonicalLocales(schedule.language);
      } catch {
        context.error(
          'dailyReset.language',
          'must be a valid dataset language tag.',
        );
      }
    },
  });
}

/** Normalize resolved configuration without consulting process-global environment. */
export function resolveDemoModeSettings(
  config: Pick<AppConfigAccessor, 'get'>,
): DemoModeSettings {
  const section = config.get<DemoModeConfig>('demoMode') ?? {};
  const enabled = section.enabled ?? false;
  if (typeof enabled !== 'boolean')
    throw new Error('demoMode.enabled must be a boolean.');
  return {
    enabled,
    allowCollections: new Set(
      [...DEFAULT_ALLOW_COLLECTIONS, ...(section.allowCollections ?? [])].map(
        (table) => table.trim(),
      ),
    ),
    quickSignIn: section.quickSignIn !== false,
    dailyReset: {
      ...DEFAULT_DAILY_RESET,
      ...section.dailyReset,
      enabled: true,
    },
  };
}

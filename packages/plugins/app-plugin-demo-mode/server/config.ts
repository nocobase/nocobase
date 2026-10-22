import {
  defineAppConfig,
  envString,
  envStrings,
  type AppConfigAccessor,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

/** Deployment-level request policy; business authorization remains independent. */
export type DemoMode = 'off' | 'read-only' | 'observe';

export interface DemoModeSettings {
  readonly mode: DemoMode;
  readonly allowCollections: ReadonlySet<string>;
  readonly quickSignIn: boolean;
}

/** Register this section separately from the Server plugin in defaultAppConfigs. */
export interface DemoModeConfig {
  readonly mode?: DemoMode;
  /** Logical collection names in the default database connection, matching migrations. */
  readonly allowCollections?: readonly string[];
  readonly quickSignIn?: boolean;
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
    defaults: { mode: 'off', allowCollections: [], quickSignIn: true },
    env: {
      [DEMO_MODE_ENV]: envString('mode', {
        description: 'Demo request policy: off, observe or read-only.',
      }),
      [DEMO_MODE_WRITABLE_COLLECTIONS_ENV]: envStrings(
        'allowCollections',
        ',',
        {
          description:
            'Comma-separated logical collections writable in demo mode.',
        },
      ),
    },
    validate(value, context) {
      if (!['off', 'observe', 'read-only'].includes(value.mode ?? ''))
        context.error('mode', 'must be off, observe or read-only.');
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
    },
  });
}

/** Normalize resolved configuration without consulting process-global environment. */
export function resolveDemoModeSettings(
  config: Pick<AppConfigAccessor, 'get'>,
): DemoModeSettings {
  const section = config.get<DemoModeConfig>('demoMode') ?? {};
  return {
    mode: section.mode ?? 'off',
    allowCollections: new Set(
      [...DEFAULT_ALLOW_COLLECTIONS, ...(section.allowCollections ?? [])].map(
        (table) => table.trim(),
      ),
    ),
    quickSignIn: section.quickSignIn !== false,
  };
}

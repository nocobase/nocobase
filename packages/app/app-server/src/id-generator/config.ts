export type { SnowflakeIdGeneratorConfig } from '@nocobase/snowflake';
import {
  SNOWFLAKE_EPOCH_SECONDS,
  type SnowflakeIdGeneratorConfig,
} from '@nocobase/snowflake';
import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
  type ConfigValidator,
} from '../config/index.js';

export type AppSnowflakeConfig =
  | (SnowflakeIdGeneratorConfig & { readonly mode?: 'manual' })
  | {
      readonly mode: 'auto';
      readonly workerId?: never;
      readonly epoch?: never;
    };

export type ExtendedAppSnowflakeConfig<TExtension extends object> =
  AppSnowflakeConfig & Omit<TExtension, 'mode' | 'workerId' | 'epoch'>;

/** Compose one snowflake section; the host owns mode, manual defaults and its environment mapping. */
export function defineAppSnowflakeConfig<TExtension extends object = object>(
  extension?: AppConfigFactory<TExtension>,
): AppConfigFactory<ExtendedAppSnowflakeConfig<TExtension>> {
  return defineAppConfig<ExtendedAppSnowflakeConfig<TExtension>>({
    defaults: (runtime) => {
      // Extensions contribute options, never host-owned defaults.
      const options = Object.fromEntries(
        Object.entries(extension?.(runtime) ?? {}).filter(
          ([key]) => key !== 'mode' && key !== 'workerId' && key !== 'epoch',
        ),
      ) as Omit<TExtension, 'mode' | 'workerId' | 'epoch'>;
      return {
        ...options,
        ...(runtime.config.get('snowflake.mode') === 'auto'
          ? { mode: 'auto' as const }
          : {
              mode: 'manual' as const,
              workerId: 0,
              epoch: SNOWFLAKE_EPOCH_SECONDS,
            }),
      };
    },
    validate: [
      (value, context) => {
        if (
          value.mode !== undefined &&
          value.mode !== 'manual' &&
          value.mode !== 'auto'
        )
          context.error('mode', 'Snowflake mode must be manual or auto.');
        if (value.mode === 'auto') {
          if (value.workerId !== undefined)
            context.error(
              'workerId',
              'Automatic mode forbids workerId, including SNOWFLAKE_WORKER_ID.',
            );
          if (value.epoch !== undefined)
            context.error('epoch', 'Automatic mode uses the standard epoch.');
        }
      },
      ...(extension?.rules?.validators ?? []).map(
        (validate): ConfigValidator<ExtendedAppSnowflakeConfig<TExtension>> =>
          (value, context) =>
            validate(value as never, context),
      ),
    ],
    env: {
      ...extension?.rules?.env,
      SNOWFLAKE_WORKER_ID: envInteger('workerId', {
        description:
          'A worker ID unique to each concurrently running manual instance, 0 to 31. Forbidden in auto mode.',
      }),
    },
    public: extension?.rules?.public,
  });
}

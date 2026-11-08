export type { SnowflakeIdGeneratorConfig } from '@nocobase/snowflake';
import type { SnowflakeIdGeneratorConfig } from '@nocobase/snowflake';

export type AppSnowflakeConfig =
  | (SnowflakeIdGeneratorConfig & { readonly mode?: 'manual' })
  | {
      readonly mode: 'auto';
      readonly workerId?: never;
      readonly epoch?: never;
    };

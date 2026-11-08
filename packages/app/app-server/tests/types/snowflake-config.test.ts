import { expectTypeOf, it } from 'vitest';
import {
  defineAppConfig,
  type AppConfigFactory,
} from '../../src/config/index.js';
import {
  defineAppSnowflakeConfig,
  type AppSnowflakeConfig,
} from '../../src/id-generator/index.js';

it('preserves adapter fields without narrowing the host mode union to the adapter default', () => {
  const extension = defineAppConfig({
    defaults: { mode: 'auto' as const, workerId: 9, adapterOption: 'example' },
  });
  const composed = defineAppSnowflakeConfig(extension);
  expectTypeOf(composed).toEqualTypeOf<
    AppConfigFactory<AppSnowflakeConfig & { adapterOption: string }>
  >();
  expectTypeOf<ReturnType<typeof composed>['mode']>().toEqualTypeOf<
    'manual' | 'auto' | undefined
  >();
  expectTypeOf(defineAppSnowflakeConfig()).toMatchTypeOf<
    AppConfigFactory<AppSnowflakeConfig>
  >();
});

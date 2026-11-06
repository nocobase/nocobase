import type {
  AppConcurrencyConfig,
  ConcurrencyConfigEntry,
  ResolvedConcurrencyConfig,
} from '@nocobase/app-plugin-concurrency/server';

declare module '@nocobase/app-plugin-concurrency/server' {
  interface ConcurrencyAdapterConnections {
    typeTest: { readonly host: string };
  }
}
const config: AppConcurrencyConfig = {
  default: 'shared',
  shared: { adapter: 'typeTest', connection: { host: 'localhost' } },
};
// @ts-expect-error Non-mutex adapters require their declared connection.
const missing: ConcurrencyConfigEntry = { adapter: 'typeTest' };
// @ts-expect-error Mutex must not inherit the augmented adapter's connection.
const mixed: ConcurrencyConfigEntry = {
  adapter: 'mutex',
  connection: { host: 'localhost' },
};
const wrong: ConcurrencyConfigEntry = {
  adapter: 'typeTest',
  // @ts-expect-error Augmented connections retain their own precise type.
  connection: { port: 6379 },
};
declare const resolved: ResolvedConcurrencyConfig;
if (resolved.adapter === 'typeTest') {
  const host: string = resolved.connection.host;
  void host;
}
void [config, missing, mixed, wrong];
